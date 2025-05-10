import os
import pandas as pd
import random
from pydantic import BaseModel
from fastapi import HTTPException
from best_risky_three_loans_for_candidate import beregn_maanedlig_betaling, beregn_effektiv_rente
import math

class User(BaseModel):
    username: str
    password: str  
    age: int

def get_random_loan_and_status():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "forbrukslan_data_clean.csv"))
    df = pd.read_csv(csv_path)
    selected = df.sample(1).iloc[0]

    max_loan = float(selected["Maks beløp"])
    min_loan = float(selected["Min beløp"])

    øvre_grense = min(500_000, max_loan)
    nedre_grense = max(50_000, min_loan)

    if nedre_grense >= øvre_grense:
        nedre_grense = øvre_grense * 0.8

    total_laanebelop = round(random.randint(int(nedre_grense), int(øvre_grense)) / 1000) * 1000
    andel_nedbetalt = random.uniform(0.3, 0.8)

    nedbetalt = round(total_laanebelop * andel_nedbetalt)
    gjenstaaende = total_laanebelop - nedbetalt

    maks_løpetid_år = int(selected["Maks løpetid (år)"])
    total_løpetid_mnd = maks_løpetid_år * 12
    gjenstaaende_mnd = max(1, round((1 - andel_nedbetalt) * total_løpetid_mnd))

    nominell_rente_aarlig = float(selected["Nominell rente"])
    etableringsgebyr_prosent = float(selected.get("Etableringsgebyr i %", 0))
    etableringsgebyr_min = float(selected.get("Etableringsgebyr", 0))
    termingebyr = float(selected.get("Termingebyr", 0))

    effektiv_rente = beregn_effektiv_rente(
        gjenstaaende,
        gjenstaaende_mnd,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    monthly_payment = beregn_maanedlig_betaling(
        gjenstaaende,
        gjenstaaende_mnd,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    totalKostnad = monthly_payment * gjenstaaende_mnd

    return {
        "bank": selected["Bank"],
        "produkt": selected["Lånenavn"],
        "sum_lånt": total_laanebelop,
        "effektiv_rente": effektiv_rente,
        "monthly_payment": monthly_payment,
        "nedbetalt": nedbetalt,
        "mangler": gjenstaaende,
        "months": gjenstaaende_mnd,
        "gjennstende_total_kostnad": totalKostnad
    }


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