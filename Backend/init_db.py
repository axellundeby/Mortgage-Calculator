import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(__file__), "flytta.db")

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            age INTEGER NOT NULL,
            auto_refinansiering BOOLEAN DEFAULT 1
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS loans (
            username TEXT PRIMARY KEY,
            bank TEXT,
            produkt TEXT,
            sum_lant REAL,
            effektiv_rente REAL,
            monthly_payment REAL,
            nedbetalt REAL,
            mangler REAL,
            years INTEGER,
            gjennstende_total_kostnad REAL,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')

    c.execute('''
    CREATE TABLE IF NOT EXISTS loan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        bank TEXT,
        produkt TEXT,
        effektiv_rente REAL,
        monthly_payment REAL,
        nedbetalt REAL,
        mangler REAL,
        years INTEGER,
        gjennstende_total_kostnad REAL,
        savings REAL,
        is_initial BOOLEAN DEFAULT 0
    )
''')


    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"✅ Database initialized at {DB_NAME}")