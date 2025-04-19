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

def get_user_age(username: str) -> int:
    users = load_users()
    if username not in users:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")
    return users[username].get("age", 25)

def save_user_loan(username: str, loan_data: dict):
    users = load_users()
    if username not in users:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

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

    øvre_grense = min(500_000, max_loan)
    nedre_grense = max(20_000, min_loan)

    if nedre_grense >= øvre_grense:
        nedre_grense = øvre_grense * 0.8  # fallback hvis grensen er for trang

    # Simuler hvor mye som er betalt ned
    total_laanebelop = round(random.randint(int(nedre_grense), int(øvre_grense)) / 1000) * 1000
    andel_nedbetalt = random.uniform(0.3, 0.8)  # antar mellom 30–80 % er betalt ned

    nedbetalt = round(total_laanebelop * andel_nedbetalt)
    gjenstaaende = total_laanebelop - nedbetalt

    maks_løpetid = int(selected["Maks løpetid (år)"])
    estimerte_gjenstående_år = max(1, round((1 - andel_nedbetalt) * maks_løpetid))

    nominell_rente_aarlig = selected["Nominell rente"]
    etableringsgebyr_prosent = selected["Etableringsgebyr i %"]
    etableringsgebyr_min = selected["Etableringsgebyr"]
    termingebyr = selected["Termingebyr"]

    effektiv_rente = beregn_effektiv_rente(
        total_laanebelop,
        maks_løpetid,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    montly_payment = beregn_maanedlig_betaling(
        total_laanebelop,
        maks_løpetid,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    totalKostnad = montly_payment * 12 * estimerte_gjenstående_år

    return {
        "bank": selected["Bank"],
        "produkt": selected["Lånenavn"],
        "sum_lånt": total_laanebelop,
        "effektiv_rente": effektiv_rente,
        "måntlig_betaling": montly_payment,
        "nedbetalt": nedbetalt,
        "mangler": gjenstaaende,
        "years": estimerte_gjenstående_år,
        "gjennstende_total_kostnad": totalKostnad
    }

def transform_to_user_loan_format(alt_loan: dict, base_loan: dict) -> dict:
    return {
        "bank": alt_loan.get("Bank"),
        "produkt": alt_loan.get("Produkt"),
        "sum_lånt": base_loan.get("mangler"),
        "effektiv_rente": alt_loan.get("Effektiv rente"),
        "måntlig_betaling": alt_loan.get("Måndlig betaling"),
        "nedbetalt": 0,
        "mangler": base_loan.get("mangler"),
        "years": base_loan.get("years"),
        "gjennstende_total_kostnad": alt_loan.get("total") or alt_loan.get("total_kostnad") or 0
    }
