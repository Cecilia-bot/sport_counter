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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            counter INTEGER DEFAULT 0,
            total_spent REAL DEFAULT 0.0,
            is_admin INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            last_login TEXT
        )""")
        await db.execute("""
        CREATE TABLE IF NOT EXISTS table_resorts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, 
            price REAL NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        )""")
        await db.execute("""
        CREATE TABLE IF NOT EXISTS table_user_resorts_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            resort_id INTEGER NOT NULL,
            visit_date TEXT DEFAULT (datetime('now')),
            price_paid REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES table_users(id) ON DELETE CASCADE,
            FOREIGN KEY (resort_id) REFERENCES table_resorts(id) ON DELETE CASCADE
        )""")

        cursor = await db.execute("SELECT COUNT(*) FROM table_resorts")
        (count,) = await cursor.fetchone()
        if count == 0:
            await db.executemany(
                "INSERT INTO table_resorts (name, price) VALUES (?, ?)",
                [("stubai", 72.50),
                ("schlick", 49.70),
                ("axamer lizum", 56.50)]
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
        cursor = await db.execute("SELECT id, price FROM table_resorts WHERE name = ?", (resort_name,))
        row = await cursor.fetchone()

        if not row:
            return {"error": "Invalid resort"}
        resort_id, price = row

        #check if user exists, otherwise create it
        cursor = await db.execute("SELECT id, counter, total_spent FROM table_users WHERE email = ?", (email,))
        user = await cursor.fetchone()
        is_admin = email in ADMIN_GROUP

        if user:
            user_id, counter, total_spent = user
            counter += 1
            total_spent += price
            await db.execute("UPDATE table_users SET email=?, counter=?, total_spent=?, is_admin=?, last_login=datetime('now') WHERE id=?",
                             (email, counter, total_spent, is_admin, user_id))
        else:
            counter = 1
            total_spent = price
            await db.execute("INSERT INTO table_users (email, counter, total_spent, is_admin, last_login) VALUES (?, ?, ?, ?, datetime('now'))",
                             (email, counter, total_spent, is_admin))
            user_id = cursor.lastrowid

        # create visit
        await db.execute("INSERT INTO table_user_resorts_visits (user_id, resort_id, visit_date, price_paid) VALUES (?, ?, datetime('now'), ?)", 
                         (user_id, resort_id, price))
        
        await db.commit()

        total_saved = SKIPASS + total_spent
        return {
            "counter": counter,
            "total_spent": total_spent,
            "total_saved": total_saved,
            "is_admin": is_admin
        }

#the next code chunk is to display the data from the user
@app.get("/state/{email}")
async def get_state(email: str, user=Depends(verify_token)):
    email  = email.lower()
    if user["email"].lower() != email:
        raise HTTPException(status_code=403, detail="Access denied")
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT counter, total_spent, is_admin FROM table_users WHERE email =?", (email,))
        user = await cursor.fetchone()
        is_admin_fallback = email in ADMIN_GROUP

        if user is None:
            return {"counter": 0, "total_spent": 0, "is_admin": is_admin_fallback, "total_saved": SKIPASS}

        counter, total_spent, is_admin = user
        total_saved = SKIPASS + total_spent

        return {
            "counter": counter,
            "total_spent": total_spent,
            "total_saved": total_saved,
            "is_admin": is_admin
        }

@app.get("/state/{email}/visits")
async def get_visits(email: str, user=Depends(verify_token)):
    email = email.lower()
    if user["email"].lower() != email:
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("""
            SELECT
                tbl_visit.visit_date,
                table_resorts.name as resort_name,
                tbl_visit.price_paid
            FROM table_user_resorts_visits tbl_visit
            JOIN table_users ON tbl_visit.user_id = table_users.id
            JOIN table_resorts ON tbl_visit.resort_id = table_resorts.id
            WHERE table_users.email = ?
            ORDER BY tbl_visit.visit_date DESC
        """, (email,))

        visits = await cursor.fetchall()
        return [
            {
                "visit_date": visit_date,
                "resort": resort_name,
                "price_paid": price_paid
            }
            for (visit_date, resort_name, price_paid) in visits
        ]

def admin_only(user=Depends(verify_token)):
    if user.get("email") not in ADMIN_GROUP:
        raise HTTPException(status_code=403, detail="You need admin permissions to access this page")
    return user

@app.get("/resorts")
async def list_resorts():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, name, price, updated_at FROM table_resorts ORDER BY name ASC")
        rows = await cursor.fetchall()
        return [
            {
                "id": id,
                "name": name, 
                "price": price, 
                "updated_at": updated_at
            } 
            for (id, name, price, updated_at) in rows
        ]
    
@app.post("/resorts")
async def add_resort(resort: Resort, user=Depends(admin_only)):   
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO table_resorts (name, price) VALUES (?, ?)",
                (resort.name.lower(), resort.price)
            )
            await db.commit()
            cursor = await db.execute(
                "SELECT id FROM table_resorts WHERE name = ?",
                (resort.name.lower(),)
            )
            (resort_id,) = await cursor.fetchone()
            return {"id": resort_id, "message": "Resort added successfully!"}
        except Exception as e:
            return{"error": str(e)}

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
        filename=backup_name,
        headers={"Access-Control-Expose-Headers": "Content-Disposition"}
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
    
