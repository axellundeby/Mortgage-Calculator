from fastapi import FastAPI
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware
from best_risky_three_loans_for_candidate import find_best_loan

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoanRequest(BaseModel):
    age: int
    amount: float
    years: int

@app.post("/api/find-loan")
def api_find_loan(req: LoanRequest):
    # Absolutt sti til CSV-filen uansett hvor serveren startes fra
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))
    print(f"🔍 Leser CSV fra: {csv_path}")

    loans = find_best_loan(
        csv_path=csv_path,
        age=req.age,
        amount=req.amount,
        years=req.years,
        top_n=3  
    )

    return loans

#uvicorn api:app --reload