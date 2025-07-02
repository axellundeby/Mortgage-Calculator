import os
import pandas as pd
import random
from pydantic import BaseModel
from fastapi import HTTPException
from loan_evaluator import calculate_monthly_payment, calculate_intrest
import math

class User(BaseModel):
    username: str
    password: str  
    age: int
    
    
def get_random_loan_entry(path):
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", path))
    df = pd.read_csv(csv_path)
    random_selected_loan = df.sample(1).iloc[0].to_dict()
    return get_random_loan_and_status(random_selected_loan)

def get_random_loan_and_status(random_selected_loan):
    
    total_amount= set_total_loan_amount(random_selected_loan)
    portion_paid = round(total_amount * random.uniform(0.3, 0.8))
    remaining = total_amount - portion_paid

    down_payment_in_years = int(random_selected_loan["Maks løpetid (år)"])
    total_løpetid_mnd = down_payment_in_years * 12

    portion_paid_fraction = portion_paid / total_amount
    remaning_months = max(1, round((1 - portion_paid_fraction) * total_løpetid_mnd))


    yearly_intrest = float(random_selected_loan["Nominell rente"])
    establisment_fee = float(random_selected_loan.get("Etableringsgebyr", 0))
    fee_precentage = float(random_selected_loan.get("Etableringsgebyr i %", 0))
    yearly_fee = float(random_selected_loan.get("Termingebyr", 0))

    effektiv_rente = calculate_intrest(
        remaining,
        remaning_months,
        yearly_intrest,
        fee_precentage,
        establisment_fee,
        yearly_fee
    )

    monthly_payment = calculate_monthly_payment(
        remaining,
        remaning_months,
        yearly_intrest,
        fee_precentage,
        establisment_fee,
        yearly_fee
    )

    left_to_pay = monthly_payment * remaning_months

    return {
        "bank": random_selected_loan["Bank"],
        "produkt": random_selected_loan["Lånenavn"],
        "sum_lånt": total_amount,
        "effektiv_rente": effektiv_rente,
        "monthly_payment": monthly_payment,
        "nedbetalt": portion_paid,
        "mangler": remaining,
        "months": remaning_months,
        "gjennstende_total_kostnad": left_to_pay
    }

def set_total_loan_amount(random_selected_loan) -> int:
    max_amount = random_selected_loan["Maks beløp"]
    min_amount = random_selected_loan["Min beløp"]
    lower_bound = max(50_000, float(min_amount))
    upper_bound = min(500_000, float(max_amount))

    if lower_bound >= upper_bound:
        lower_bound = upper_bound * 0.8

    total_loan_amoaunt = round(random.randint(int(lower_bound), int(upper_bound)) / 1000) * 1000
    return total_loan_amoaunt


def transform_to_user_loan_format(alt_loan: dict, base_loan: dict) -> dict:
    return {
        "bank": alt_loan.get("Bank"),
        "produkt": alt_loan.get("Produkt"),
        "sum_lånt": base_loan.get("mangler"),
        "effektiv_rente": alt_loan.get("Effektiv rente"),
        "monthly_payment": alt_loan.get("monthly_payment"),
        "nedbetalt": 0,
        "mangler": base_loan.get("mangler"),
        "months": base_loan.get("months"),
        "gjennstende_total_kostnad": alt_loan.get("total") or alt_loan.get("total_kostnad") or 0
    }

def simulate_loan_after_months(loan: dict, months: int) -> dict:
    monthly_payment = loan.get("monthly_payment", 0)
    nedbetalt_ekstra = monthly_payment * months
    original_mangler = loan.get("mangler", 0)

    ny_mangler = max(original_mangler - nedbetalt_ekstra, 0)
    ny_nedbetalt = loan.get("nedbetalt", 0) + (original_mangler - ny_mangler)

    gjenstående_måneder = math.ceil(ny_mangler / monthly_payment) if monthly_payment else 12
    ny_total_kostnad = round(monthly_payment * gjenstående_måneder)

    return {
        **loan,
        "nedbetalt": ny_nedbetalt,
        "mangler": ny_mangler,
        "months": gjenstående_måneder,
        "gjennstende_total_kostnad": ny_total_kostnad
    }

def should_refinance(current_loan: dict, alternative_loan: dict) -> tuple[bool, float]:
    if not current_loan or not alternative_loan:
        return False, 0.0

    current_total = current_loan.get("gjennstende_total_kostnad", 0)
    alternative_total = alternative_loan.get("total") or alternative_loan.get("total_kostnad") or 0

    savings = current_total - alternative_total

    return (savings > 0), savings