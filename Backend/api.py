from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Request
from users import (
    register_user,
    authenticate_user,
    get_random_loan_and_status,
    get_user_loan,
    save_user_loan,
    transform_to_user_loan_format,
    get_user_age,
    User
)
from best_risky_three_loans_for_candidate import find_best_loan
import os



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class FullmaktRequest(BaseModel):
    username: str
    fullmakt: bool

class LoanRequest(BaseModel):
    age: int
    amount: float
    years: int
    age: int = 25

@app.post("/api/find-loan")
def api_find_loan(req: LoanRequest):
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))
    actual_age = get_user_age(req.username) if hasattr(req, "username") else req.age

    loans = find_best_loan(
        csv_path=csv_path,
        age=actual_age,
        amount=req.amount,
        years=req.years,
        top_n=3
    )

    return loans

@app.get("/api/user-loan/{username}")
def get_user_loan_data(username: str):
    return get_user_loan(username)

@app.post("/api/register")
def register(req: RegisterRequest):
    user = User(username=req.username, password=req.password)
    return register_user(user)

@app.post("/api/login")
def login(req: LoginRequest):
    user = User(username=req.username, password=req.password)
    return authenticate_user(user)

@app.post("/api/authorize")
def authorize(req: FullmaktRequest):
    if not req.fullmakt:
        raise HTTPException(status_code=400, detail="Fullmakt ikke gitt")
    loan_info = get_random_loan_and_status()
    save_user_loan(req.username, loan_info)
    return {"message": "Fullmakt gitt", "loan": loan_info}

@app.post("/api/save-loan")
async def save_loan_api(request: Request):
    body = await request.json()
    username = body.get("username")
    raw_loan = body.get("loan")

    if not username or not raw_loan:
        raise HTTPException(status_code=400, detail="Ugyldig data")

    existing_loan = get_user_loan(username)
    if not existing_loan:
        raise HTTPException(status_code=404, detail="Ingen eksisterende lån funnet for bruker")

    transformed = transform_to_user_loan_format(raw_loan, existing_loan)
    save_user_loan(username, transformed)

    return {"message": "Refinansiert lån lagret"}

