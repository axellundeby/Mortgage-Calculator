import os
import pandas as pd
import random
from pydantic import BaseModel
from fastapi import HTTPException
from best_risky_three_loans_for_candidate import beregn_maanedlig_betaling, beregn_effektiv_rente

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
    nedre_grense = max(20_000, min_loan)

    if nedre_grense >= øvre_grense:
        nedre_grense = øvre_grense * 0.8

    total_laanebelop = round(random.randint(int(nedre_grense), int(øvre_grense)) / 1000) * 1000
    andel_nedbetalt = random.uniform(0.3, 0.8)

    nedbetalt = round(total_laanebelop * andel_nedbetalt)
    gjenstaaende = total_laanebelop - nedbetalt

    maks_løpetid = int(selected["Maks løpetid (år)"])
    estimerte_gjenstående_år = max(1, round((1 - andel_nedbetalt) * maks_løpetid))

    nominell_rente_aarlig = selected["Nominell rente"]
    etableringsgebyr_prosent = selected["Etableringsgebyr i %"]
    etableringsgebyr_min = selected["Etableringsgebyr"]
    termingebyr = selected["Termingebyr"]

    effektiv_rente = beregn_effektiv_rente(
        total_laanebelop,
        maks_løpetid,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    montly_payment = beregn_maanedlig_betaling(
        total_laanebelop,
        maks_løpetid,
        nominell_rente_aarlig,
        etableringsgebyr_prosent,
        etableringsgebyr_min,
        termingebyr
    )

    totalKostnad = montly_payment * 12 * estimerte_gjenstående_år

    return {
        "bank": selected["Bank"],
        "produkt": selected["Lånenavn"],
        "sum_lånt": total_laanebelop,
        "effektiv_rente": effektiv_rente,
        "måntlig_betaling": montly_payment,
        "nedbetalt": nedbetalt,
        "mangler": gjenstaaende,
        "years": estimerte_gjenstående_år,
        "gjennstende_total_kostnad": totalKostnad
    }

def transform_to_user_loan_format(alt_loan: dict, base_loan: dict) -> dict:
    return {
        "bank": alt_loan.get("Bank"),
        "produkt": alt_loan.get("Produkt"),
        "sum_lånt": base_loan.get("mangler"),
        "effektiv_rente": alt_loan.get("Effektiv rente"),
        "måntlig_betaling": alt_loan.get("Måndlig betaling"),
        "nedbetalt": 0,
        "mangler": base_loan.get("mangler"),
        "years": base_loan.get("years"),
        "gjennstende_total_kostnad": alt_loan.get("total") or alt_loan.get("total_kostnad") or 0
    }
