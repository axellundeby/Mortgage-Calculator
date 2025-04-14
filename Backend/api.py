from fastapi import FastAPI
from pydantic import BaseModel
from top_risky_loan_for_candidate_sorted import find_best_loan

app = FastAPI()

class LoanRequest(BaseModel):
    age: int
    amount: float
    years: int

@app.post("/api/find-loan")
def api_find_loan(data: LoanRequest):
    loans = find_best_loan(
        "forbrukslan_data_clean.csv",
        age=data.age,
        amount=data.amount,
        years=data.years,
        top_n=3
    )
    return loans
