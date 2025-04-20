from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from best_risky_three_loans_for_candidate import find_best_loan
from fastapi import Body
import os
from users import get_random_loan_and_status, transform_to_user_loan_format
from database import (
    authenticate_user,
    get_user_age,
    get_user_loan,
    save_user_loan,
    create_user,
    is_auto_refinancing_enabled,
    get_connection,
    get_loan_history,
    get_total_savings

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

class UsernameOnlyRequest(BaseModel):
    username: str


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

    # Hvis lånet ser "ferdig" ut, lagre direkte
    if all(key in raw_loan for key in ["monthly_payment", "nedbetalt", "mangler", "years"]):
        save_user_loan(username, raw_loan)
        return {"message": "Simulert lån lagret"}

    # Ellers bruk transformering (fra refinansieringsvalg)
    base_loan = get_user_loan(username)
    final_loan = transform_to_user_loan_format(raw_loan, base_loan)
    save_user_loan(username, final_loan)
    return {"message": "Refinansiert lån lagret"}


@app.post("/api/auto-refinance")
def auto_refinance(req: UsernameOnlyRequest):
    username = req.username

    if not is_auto_refinancing_enabled(username):
        return {"should_refinance": False, "message": "Auto-refinansiering er deaktivert"}

    user_loan = get_user_loan(username)
    age = get_user_age(username)

    # Hent beste alternativ
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))
    from best_risky_three_loans_for_candidate import find_best_loan
    alternatives = find_best_loan(csv_path, age, user_loan["mangler"], user_loan["years"], top_n=1)

    if not alternatives:
        raise HTTPException(status_code=404, detail="Fant ingen alternative lån")

    best = alternatives[0]
    from users import should_refinance, transform_to_user_loan_format
    should, savings = should_refinance(user_loan, best)

    if should:
        refined = transform_to_user_loan_format(best, user_loan)
        return {
            "should_refinance": True,
            "savings": savings,
            "suggested_loan": refined
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


@app.post("/api/simulate-loan")
def simulate_loan(username: str = Body(...), months: int = Body(...)):
    loan = get_user_loan(username)
    if not loan:
        raise HTTPException(status_code=404, detail="Ingen lån funnet")
    from users import simulate_loan_after_months
    return simulate_loan_after_months(loan, months)

@app.get("/api/loan-history/{username}")
def api_get_loan_history(username: str):
    return get_loan_history(username)


@app.get("/api/total-savings/{username}")
def api_get_total_savings(username: str):
    return {"total_saved": get_total_savings(username)}
