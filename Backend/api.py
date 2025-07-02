from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from loan_evaluator import find_best_loan, simulate_loan_over_time
from risky_Loans_writer import fetch_loan_data
from fastapi import Body
import os
import math
from users import get_random_loan_and_status, transform_to_user_loan_format, should_refinance, set_total_loan_amount, get_random_loan_entry
from database import (
    authenticate_user,
    get_user_age,
    get_user_loan,
    save_user_loan,
    create_user,
    is_auto_refinancing_enabled,
    get_connection,
    get_loan_history, 
    get_total_savings,
    archive_user_loan,
    clear_loan_history
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
    username:str
    age: int
    amount: float
    months: int

class UsernameOnlyRequest(BaseModel):
    username: str

@app.post("/api/fetch-loan-data")
def fetch_loan_data_endpoint():
    try:
        fetch_loan_data()
        return {"message": "Lånedata oppdatert"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=403, detail="Fullmakt kreves")

    username = req.username
    loan = get_random_loan_entry("backend/forbrukslan_data_clean.csv")
    
    try:
        get_user_loan(username)
    except HTTPException:
        save_user_loan(username, loan)
        archive_user_loan(username, loan, savings=0.0, is_initial=True)

    return {"loan": loan}


@app.post("/api/find-loan")
def api_find_loan(req: LoanRequest):
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend/forbrukslan_data_clean.csv"))
    print("finner lån",req.age, req.amount, req.months)

    loans = find_best_loan(csv_path, req.age, req.amount, req.months, top_n=10)

    try:
        current_loan = get_user_loan(req.username)
    except Exception:
        return loans[:3]

    filtered = []
    for loan in loans:
        for key in loan:
            if loan[key] is None or (isinstance(loan[key], float) and math.isnan(loan[key])):
                loan[key] = 0

        should, _ = should_refinance(current_loan, loan)
        if should:
            filtered.append(loan)
        if len(filtered) == 3:
            break

    return filtered




@app.post("/api/save-loan")
async def save_loan_api(request: Request):
    body = await request.json()
    username = body.get("username")
    raw_loan = body.get("loan")

    if not username or not raw_loan:
        raise HTTPException(status_code=400, detail="Ugyldig data")

    try:
        base_loan = get_user_loan(username)
    except HTTPException:
        save_user_loan(username, raw_loan)
        archive_user_loan(username, raw_loan, savings=0.0, is_initial=False)
        return {"message": "Første lån registrert"}

    if raw_loan.get("simulert", False):
        save_user_loan(username, raw_loan)
        print("larger simulert lån")
        print(f"✅ Simulert lån lagret for bruker '{username}': {raw_loan}")
        return {"message": "Simulert lån lagret"}

    csv_keys = ["Bank", "Produkt", "Effektiv rente", "Totalkostnad", "total"]
    if any(key in raw_loan for key in csv_keys):
        raw_loan = transform_to_user_loan_format(raw_loan, base_loan)


    # Beregn besparelse
    tidligere_kostnad = base_loan.get("gjennstende_total_kostnad") or 0
    ny_kostnad = raw_loan.get("gjennstende_total_kostnad") or 0
    spart = max(0, round(tidligere_kostnad - ny_kostnad))

    # Arkiver og lagre nytt lån
    archive_user_loan(username, raw_loan, savings=spart, is_initial=False)
    save_user_loan(username, raw_loan)

    print(f"✅ Lån lagret for bruker '{username}': {raw_loan}")

    return {"message": "Lån lagret"}



@app.post("/api/auto-refinance")
def auto_refinance(req: UsernameOnlyRequest):
    username = req.username
    if not is_auto_refinancing_enabled(username):
        return {"should_refinance": False, "message": "Auto-refinansiering er deaktivert"}

    user_loan = get_user_loan(username)
    age = get_user_age(username)

    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend/forbrukslan_data_clean.csv"))
    print(age, user_loan["mangler"], user_loan["months"])
    alternatives = find_best_loan(csv_path, age, user_loan["mangler"], user_loan["months"], top_n=3)

    if not alternatives:
        raise HTTPException(status_code=404, detail="Fant ingen alternative lån")

    best = alternatives[0]
    should, savings = should_refinance(user_loan, best)

    if should:
        refined = transform_to_user_loan_format(best, user_loan)
        return {
            "should_refinance": True,
            "savings": savings,
            "suggested_loan": safe_loan_for_json(refined)
        }

    return {"should_refinance": False}


@app.post("/api/set-auto-refinansiering")
async def set_auto_refinansiering(req: Request):
    body = await req.json()
    username = body.get("username")
    status = body.get("auto_refinansiering")

    if username is None or status is None:
        raise HTTPException(status_code=400, detail="Ugyldig forespørsel")

    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET auto_refinansiering = ? WHERE username = ?", (int(status), username))
    conn.commit()
    conn.close()

    return {"message": f"Auto-refinansiering er nå {'aktivert' if status else 'deaktivert'}"}

@app.get("/api/get-auto-refinansiering/{username}")
def get_auto_refinansiering(username: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT auto_refinansiering FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Bruker finnes ikke")

    return {"auto_refinansiering": bool(row[0])}


@app.get("/api/loan-history/{username}")
def loan_history(username: str):
    return get_loan_history(username)

@app.get("/api/total-savings/{username}")
def total_savings(username: str):
    return {"total_saved": get_total_savings(username)}

def safe_loan_for_json(loan: dict):
    return {
        k: (0 if v is None or (isinstance(v, float) and math.isnan(v)) else v)
        for k, v in loan.items()
    }

@app.post("/api/clear-loan-history")
def clear_loan_history_endpoint(req: UsernameOnlyRequest):
    clear_loan_history(req.username)
    return {"message": "Lånehistorikk fjernet"}


@app.get("/api/has-consent/{username}")
def has_consent(username: str):
    try:
        get_user_loan(username)
        return {"has_consent": True}
    except HTTPException:
        return {"has_consent": False}

@app.post("/api/simulate-loan")
def simulate_loan(months: int = Body(..., embed=True)):
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend/forbrukslan_data_clean.csv"))
    try:
        result = simulate_loan_over_time(csv_path, months)
        return {"message": f"{len(result['updated_rows'])} rader oppdatert", "indices": result["updated_rows"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

