from fastapi import FastAPI, Header, HTTPException, Depends
from pydantic import BaseModel
import aiosqlite
import firebase_admin
from firebase_admin import auth as admin_auth, credentials
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # or ["http://localhost:5500"] for a specific origin
    allow_credentials=True,
    allow_methods=["*"],      # GET, POST, etc.
    allow_headers=["*"],      # Authorization, Content-Type, etc.
)

SKIPASS = -759 #caps lock is a constant (e.g price of Freizeitticket)

cred = credentials.Certificate("../segreti_segretissimi/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

class AddRequest(BaseModel):
    resort_name: str

class Resort(BaseModel):
    name: str
    price: float

@app.on_event("startup")
async def startup():
    async with aiosqlite.connect("app.db") as db:
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
    async with aiosqlite.connect("app.db") as db:

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
    async with aiosqlite.connect("app.db") as db:
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
@app.get("/resorts")
async def list_resorts():
    async with aiosqlite.connect("app.db") as db:
        cursor = await db.execute("SELECT name, price FROM table_resorts")
        rows = await cursor.fetchall()
        return [{"name": name, "price": price} for (name, price) in rows]
    
@app.post("/resorts")
async def add_resort(resort: Resort):
    async with aiosqlite.connect("app.db") as db:
        try:
            await db.execute(
                "INSERT INTO table_resorts (name, price) VALUES (?, ?)",
                (resort.name.lower(), resort.price)
            )
            await db.commit()
        except Exception as e:
            return{"error": str(e)}
    return {"message": "Resort added successfully!"}


    
