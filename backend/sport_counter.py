from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
import aiosqlite
import sqlite3
import firebase_admin
import os
import json
from datetime import datetime
from firebase_admin import auth as admin_auth, credentials
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sportcounter.up.railway.app",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],      # GET, POST, etc.
    allow_headers=["*"],      # Authorization, Content-Type, etc.
)

SKIPASS = -759 #caps lock is a constant (e.g price of Freizeitticket)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_GROUP = ["barile.cec@gmail.com", "vmacarios@gmail.com"]
DB_PATH = os.path.join(os.path.dirname(__file__), "db", "app.db")
BACKUP_DIR = os.path.join(os.path.dirname(__file__), "db", "backups")

os.makedirs(BACKUP_DIR, exist_ok=True)  # ensure folder exists

# Read Firebase credentials from environment variable
firebase_creds = os.getenv("FIREBASE_CREDENTIALS")

if firebase_creds:
    cred_dict = json.loads(firebase_creds)
    cred = credentials.Certificate(cred_dict)
elif os.path.exists(os.path.join(BASE_DIR, "serviceAccountKey.json")):
    cred = credentials.Certificate(os.path.join(BASE_DIR, "serviceAccountKey.json"))
else:
    raise RuntimeError("FIREBASE_CREDENTIALS environment variable not set or serviceAccountKey.json not found")

firebase_admin.initialize_app(cred)

class AddRequest(BaseModel):
    resort_name: str

class Resort(BaseModel):
    name: str
    price: float

@app.on_event("startup")
async def startup():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS table_users (
            email TEXT PRIMARY KEY,
            counter INTEGER DEFAULT 0,
            total_spent REAL DEFAULT 0.0
        )""")
        await db.execute("""
        CREATE TABLE IF NOT EXISTS table_resorts (
            name TEXT PRIMARY KEY,
            price REAL NOT NULL
        )""")

        cursor = await db.execute("SELECT COUNT(*) FROM table_resorts")
        (count,) = await cursor.fetchone()
        if count == 0:
            await db.executemany(
                "INSERT INTO table_resorts (name, price) VALUES (?, ?)",
                [("stubai", 72.50),
                ("schlick", 49.70),
                ("axamer lizum", 59.50)]
            )
        await db.commit()

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    id_token = authorization[len("Bearer "):]
    try:
        decoded_token = admin_auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/state/{email}/add")
async def add(email: str, payload: AddRequest, user=Depends(verify_token)):
    resort_name = payload.resort_name
    email  = email.lower()
    if user["email"].lower() != email:
        raise HTTPException(status_code=403, detail="Access denied")
    async with aiosqlite.connect(DB_PATH) as db:

        #check if resort exists, if yes, get the price
        cursor = await db.execute("SELECT price FROM table_resorts WHERE name = ?", (resort_name,))
        row = await cursor.fetchone()

        if not row:
            return {"error": "Invalid resort"}
        price = row[0]

        #check if user exists, otherwise create it
        cursor = await db.execute("SELECT counter, total_spent FROM table_users WHERE email = ?", (email,))
        user = await cursor.fetchone()

        if user:
            counter, total_spent = user
            counter += 1
            total_spent += price
            await db.execute("UPDATE table_users SET counter=?, total_spent=? WHERE email=?",
                             (counter, total_spent, email))
        else:
            counter = 1
            total_spent = price
            await db.execute("INSERT INTO table_users (email, counter, total_spent) VALUES (?, ?, ?)",
                             (email, counter, total_spent))
        await db.commit()

        total_saved = SKIPASS + total_spent
        return {
            "counter": counter,
            "total_spent": total_spent,
            "total_saved": total_saved
        }

#the next code chunk is for the button "enter" in HTML    
@app.get("/state/{email}")
async def get_state(email: str, user=Depends(verify_token)):
    email  = email.lower()
    if user["email"].lower() != email:
        raise HTTPException(status_code=403, detail="Access denied")
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT counter, total_spent FROM table_users WHERE email =?", (email,))
        user = await cursor.fetchone()
                                  
        if user is None:
            return {"counter": 0, "total_spent": 0, "total_saved": SKIPASS}
        
        counter, total_spent = user
        total_saved = SKIPASS + total_spent

        return {
            "counter": counter,
            "total_spent": total_spent,
            "total_saved": total_saved
        }

#add resorts from the admin webpage
def admin_only(user=Depends(verify_token)):
    if user.get("email") not in ADMIN_GROUP:
        raise HTTPException(status_code=403, detail="You need admin permissions to access this page")
    return user

@app.get("/resorts")
async def list_resorts():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT name, price FROM table_resorts")
        rows = await cursor.fetchall()
        return [{"name": name, "price": price} for (name, price) in rows]
    
@app.post("/resorts")
async def add_resort(resort: Resort, user=Depends(admin_only)):   
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO table_resorts (name, price) VALUES (?, ?)",
                (resort.name.lower(), resort.price)
            )
            await db.commit()
        except Exception as e:
            return{"error": str(e)}
    return {"message": "Resort added successfully!"}

@app.get("/admin/download-db")
async def download_db(user=Depends(admin_only)):
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database not found")

    # --- Create safe backup ---
    backup_name = f"backup_app_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_name)

    try:
        src = sqlite3.connect(DB_PATH)
        dest = sqlite3.connect(backup_path)
        with dest:
            src.backup(dest)
        src.close()
        dest.close()
        print(f"✅ Backup created: {backup_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

    # --- Return backup file for download ---
    response = FileResponse(
        backup_path,
        media_type="application/octet-stream",
        filename=backup_name
    )

    # Cleanup old backups
    # (Keep only latest 5)
    try:
        backups = sorted(
            [file for file in os.listdir(BACKUP_DIR) if file.startswith("backup_app_")],
            reverse=True
        )
        for old in backups[5:]:
            os.remove(os.path.join(BACKUP_DIR, old))
    except Exception as e:
        print("Cleanup failed:", e)

    return response
    
