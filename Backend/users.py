import json
import os
import hashlib
from pydantic import BaseModel
from fastapi import HTTPException
import pandas as pd
import random
from best_risky_three_loans_for_candidate import beregn_maanedlig_betaling
from best_risky_three_loans_for_candidate import beregn_effektiv_rente

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")


class User(BaseModel):
    username: str
    password: str  


def hash_password(password: str) -> str:
    return password


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)


def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def save_user_loan(username: str, loan_data: dict):
    users = load_users()
    if username not in users:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    if "loan" not in users[username]:
        users[username]["loan"] = loan_data
        save_users(users)

def get_user_loan(username: str):
    users = load_users()
    if username not in users:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    return users[username].get("loan", None)


def register_user(user: User):
    users = load_users()
    if user.username in users:
        raise HTTPException(status_code=400, detail="Brukernavn er allerede i bruk")

    users[user.username] = {
        "password": hash_password(user.password)
    }
    save_users(users)
    print(f"✅ Registrerer bruker: {user.username}, passord: {user.password}")
    return {"message": "Bruker registrert"}


def authenticate_user(user: User):
    users = load_users()
    if user.username not in users:
        raise HTTPException(status_code=401, detail="Feil brukernavn eller passord")

    expected_hash = users[user.username]["password"]
    if hash_password(user.password) != expected_hash:
        raise HTTPException(status_code=401, detail="Feil brukernavn eller passord")

    return {"message": "Innlogging vellykket"}

#Bank,Lånenavn,Nominell rente,Etableringsgebyr,Etableringsgebyr i %,Termingebyr,Min beløp,Maks beløp,Min alder,Maks alder,Maks løpetid (år),Belaningsgrad

def get_random_loan_and_status():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))
    df = pd.read_csv(csv_path)
    selected = df.sample(1).iloc[0]

    max_loan = float(selected["Maks beløp"])
    min_loan = float(selected["Min beløp"])

    max_amount=0
    if max_loan > 1000000:
        max_amount = 1000000
    else:
        max_amount = max_loan

    paid = round(random.randint(int(min_loan), int(max_amount)) / 1000) * 1000

    andel_nedbetalt = paid / max_amount  
    maks_løpetid = int(selected["Maks løpetid (år)"])

    estimerte_gjenstående_år = max(1, round((1 - andel_nedbetalt) * maks_løpetid))


    years = random.randint(1, int(selected["Maks løpetid (år)"]))

    laanebelop = paid  
    nominell_rente_aarlig = selected["Nominell rente"]
    etableringsgebyr_prosent = selected["Etableringsgebyr i %"]
    etableringsgebyr_min = selected["Etableringsgebyr"]
    termingebyr = selected["Termingebyr"]

    missing = max_amount - paid

    effektiv_rente = beregn_effektiv_rente(
        laanebelop,
        years,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    montly_payment = beregn_maanedlig_betaling(
        laanebelop,
        years,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    return {
        "bank": selected["Bank"],
        "produkt": selected["Lånenavn"],
        "effektiv_rente": effektiv_rente,
        "måntlig_betaling": montly_payment,
        "nedbetalt": paid,
        "mangler": missing,
        "years": estimerte_gjenstående_år
    }


