from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from best_risky_three_loans_for_candidate import find_best_loan
from users import get_random_loan_and_status, transform_to_user_loan_format
from database import (
    authenticate_user,
    get_user_age,
    get_user_loan,
    save_user_loan,
    create_user
)



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
    age: int

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

@app.post("/api/register")
def register(req: RegisterRequest):
    create_user(req.username, req.password, req.age)
    return {"message": "Bruker registrert"}

@app.post("/api/login")
def login(req: LoginRequest):
    if authenticate_user(req.username, req.password):
        return {"message": "Innlogging vellykket"}
    raise HTTPException(status_code=401, detail="Feil brukernavn eller passord")

@app.get("/api/user-loan/{username}")
def get_user_loan_data(username: str):
    loan = get_user_loan(username)
    if not loan:
        raise HTTPException(status_code=404, detail="Lån ikke funnet")
    return loan

@app.get("/api/user-age/{username}")
def api_get_user_age(username: str):
    age = get_user_age(username)
    return {"age": age}


@app.post("/api/authorize")
def authorize(req: FullmaktRequest):
    if not req.fullmakt:
        raise HTTPException(status_code=400, detail="Fullmakt ikke gitt")

    loan_info = get_random_loan_and_status()
    save_user_loan(req.username, loan_info)
    return {"message": "Fullmakt gitt", "loan": loan_info}

@app.post("/api/find-loan")
def api_find_loan(req: LoanRequest):
    import os
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))

    loans = find_best_loan(
        csv_path=csv_path,
        age=req.age,
        amount=req.amount,
        years=req.years,
        top_n=3
    )
    return loans

@app.post("/api/save-loan")
async def save_loan_api(request: Request):
    body = await request.json()
    username = body.get("username")
    raw_loan = body.get("loan")

    if not username or not raw_loan:
        raise HTTPException(status_code=400, detail="Ugyldig data")

    base_loan = get_user_loan(username)
    if not base_loan:
        raise HTTPException(status_code=404, detail="Fant ikke eksisterende lån")

    final_loan = transform_to_user_loan_format(raw_loan, base_loan)
    save_user_loan(username, final_loan)
    return {"message": "Refinansiert lån lagret"}
