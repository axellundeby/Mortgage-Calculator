from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from users import register_user, authenticate_user, get_random_loan_and_status, User

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
