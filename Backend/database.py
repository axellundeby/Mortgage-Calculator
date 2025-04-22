import sqlite3
from pydantic import BaseModel
from fastapi import HTTPException

DB_NAME = "flytta.db"

class User(BaseModel):
    username: str
    password: str
    age: int
    auto_refinansiering: bool = True

def get_connection():
    return sqlite3.connect(DB_NAME)

def register_user(user: User):
    conn = get_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Brukernavn er allerede i bruk")

    c.execute(
        "INSERT INTO users (username, password, age) VALUES (?, ?, ?)",
        (user.username, user.password, user.age)
    )
    conn.commit()
    conn.close()
    print(f"✅ Registrert bruker: {user.username}, passord: {user.password}, alder: {user.age}")
    return {"message": "Bruker registrert"}

def authenticate_user(username: str, password: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT password FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    conn.close()

    if not result or result[0] != password:
        raise HTTPException(status_code=401, detail="Feil brukernavn eller passord")

    return True


def save_user_loan(username: str, loan_data: dict):
    conn = get_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    c.execute('''
        INSERT INTO loans (username, bank, produkt, sum_lant, effektiv_rente, monthly_payment,
        nedbetalt, mangler, years, gjennstende_total_kostnad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
            bank=excluded.bank,
            produkt=excluded.produkt,
            sum_lant=excluded.sum_lant,
            effektiv_rente=excluded.effektiv_rente,
            monthly_payment=excluded.monthly_payment,
            nedbetalt=excluded.nedbetalt,
            mangler=excluded.mangler,
            years=excluded.years,
            gjennstende_total_kostnad=excluded.gjennstende_total_kostnad
    ''', (
        username,
        loan_data.get("bank"),
        loan_data.get("produkt"),
        loan_data.get("sum_lånt"),
        loan_data.get("effektiv_rente"),
        loan_data.get("monthly_payment"),
        loan_data.get("nedbetalt"),
        loan_data.get("mangler"),
        loan_data.get("years"),
        loan_data.get("gjennstende_total_kostnad")
    ))

    conn.commit()
    conn.close()

def get_user_loan(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM loans WHERE username = ?", (username,))
    row = c.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Ingen lån funnet for bruker")

    columns = [column[0] for column in c.description]
    loan = dict(zip(columns, row))
    conn.close()

    loan["monthly_payment"] = loan.pop("monthly_payment", 0)

    return loan


def get_user_age(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT age FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    return result[0]

def create_user(username: str, password: str, age: int):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Brukernavn er allerede i bruk")

    c.execute(
        "INSERT INTO users (username, password, age) VALUES (?, ?, ?)",
        (username, password, age)
    )
    conn.commit()
    conn.close()
    print(f"✅ Bruker '{username}' opprettet")

def is_auto_refinancing_enabled(username: str) -> bool:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT auto_refinansiering FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    conn.close()
    if result is None:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")
    print(f"✅ Hentet auto_refinansiering for bruker '{username}': {result[0]}")
    return bool(result[0])

def set_auto_refinancing_enabled(username: str, enabled: bool):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    c.execute("UPDATE users SET auto_refinance = ? WHERE username = ?", (int(enabled), username))
    conn.commit()
    conn.close()
    print(f"✅ Auto-refinansiering for bruker '{username}' er nå {'aktivert' if enabled else 'deaktivert'}")

def archive_user_loan(username: str, loan: dict, savings: float = 0.0,is_initial: bool = False):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO loan_history (
            username, bank, produkt, effektiv_rente, monthly_payment,
            nedbetalt, mangler, years, gjennstende_total_kostnad, savings,is_initial
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    ''', (
        username,
        loan.get("bank"),
        loan.get("produkt"),
        loan.get("effektiv_rente"),
        loan.get("monthly_payment"),
        loan.get("nedbetalt"),
        loan.get("mangler"),
        loan.get("years"),
        loan.get("gjennstende_total_kostnad"),
        savings,
        int(is_initial)
    ))
    conn.commit()
    conn.close()

def get_loan_history(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM loan_history WHERE username = ? ORDER BY timestamp ASC", (username,))
    rows = c.fetchall()
    columns = [desc[0] for desc in c.description]
    conn.close()
    return [dict(zip(columns, row)) for row in rows]

def get_total_savings(username: str):
    history = get_loan_history(username)
    return round(sum(l.get("savings", 0.0) for l in history if l.get("savings")))

def clear_loan_history(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM loan_history WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    print(f"🧹 Lånehistorikk slettet for {username}")
