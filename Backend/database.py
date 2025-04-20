import sqlite3
from pydantic import BaseModel
from fastapi import HTTPException

DB_NAME = "flytta.db"

class User(BaseModel):
    username: str
    password: str
    age: int

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
