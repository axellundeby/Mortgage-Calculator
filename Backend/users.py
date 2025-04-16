import json
import os
import hashlib
from pydantic import BaseModel
from fastapi import HTTPException

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")


class User(BaseModel):
    username: str
    password: str  


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)


def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


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