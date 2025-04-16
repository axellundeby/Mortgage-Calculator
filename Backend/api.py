from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from users import register_user, authenticate_user, get_random_loan_and_status, User
from best_risky_three_loans_for_candidate import find_best_loan


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
    return {"message": "Fullmakt gitt", "loan": loan_info}
