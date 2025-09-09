import csv
import numpy_financial as npf
import random
import pandas as pd
import os



def calculate_monthly_payment(
    laanebelop,
    months,
    nominell_rente_aarlig,
    etableringsgebyr_prosent,
    etableringsgebyr_min,
    termingebyr
): 
    
    if months <= 0:
        return 0
    nedbetalingstid_maaneder = int(months)

    etableringsgebyr = max(etableringsgebyr_prosent / 100 * laanebelop, etableringsgebyr_min)
    tilbakebetalings_belop = laanebelop + etableringsgebyr 
    maanedlig_rente = nominell_rente_aarlig / 100 / 12

    maanedlig_betaling = tilbakebetalings_belop * (
        maanedlig_rente * (1 + maanedlig_rente) ** nedbetalingstid_maaneder
    ) / ((1 + maanedlig_rente) ** nedbetalingstid_maaneder - 1)

    maanedlig_betaling_med_gebyr = maanedlig_betaling + termingebyr

    return round(maanedlig_betaling_med_gebyr)

def calculate_intrest(
    laanebelop,
    months,
    nominell_rente_aarlig,
    etableringsgebyr_prosent,
    etableringsgebyr_min,
    termingebyr): 

    if months <= 0:
        return 0  
    nedbetalingstid_maaneder = int(months)
    
    etableringsgebyr = max(etableringsgebyr_prosent / 100 * laanebelop, etableringsgebyr_min)
    tilbakebetalings_belop = laanebelop + etableringsgebyr if etableringsgebyr_prosent > 0 else laanebelop
    utbetalt_belop = laanebelop if etableringsgebyr_prosent > 0 else laanebelop - etableringsgebyr

    maanedlig_rente = nominell_rente_aarlig / 100 / 12

    maanedlig_betaling = tilbakebetalings_belop * (
        maanedlig_rente * (1 + maanedlig_rente) ** nedbetalingstid_maaneder
    ) / ((1 + maanedlig_rente) ** nedbetalingstid_maaneder - 1)

    maanedlig_betaling_med_gebyr = maanedlig_betaling + termingebyr

    kontantstrom = [-utbetalt_belop] + [maanedlig_betaling_med_gebyr] * nedbetalingstid_maaneder
    effektiv_rente_per_maaned = npf.irr(kontantstrom)
    effektiv_rente_aarlig = (1 + effektiv_rente_per_maaned) ** 12 - 1

    return round(effektiv_rente_aarlig * 100, 3)



def find_best_loan(csv_path, age, amount, months, top_n=3):
    candidates = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                bank = row["Bank"]
                product = row["Lånenavn"]
                nominal = float(row["Nominell rente"])
                establishment_fee = float(row["Etableringsgebyr"] or 0)
                establishment_fee_pct = float(row.get("Etableringsgebyr i %", 0))
                term_fee = float(row["Termingebyr"] or 0)
                min_amount = float(row["Min beløp"] or 0)
                max_amount = float(row["Maks beløp"] or 1e9)
                min_age = int(row["Min alder"] or 0)
                max_age = int(row["Maks alder"] or 100)
                max_term = int(row["Maks løpetid (år)"] or 0)
                maxlvt =  float(row["Belaningsgrad"] or 0)
                lvt = amount / (amount + establishment_fee)


                max_term_months = max_term * 12
                if not maxlvt < lvt:
                    continue
                if not (min_amount <= amount <= max_amount):
                    continue
                if not (min_age <= age <= max_age):
                    continue
                if months > max_term_months:
                    continue
                effective = calculate_intrest(amount, months, nominal,establishment_fee_pct ,establishment_fee, term_fee)
                monthlypayment = calculate_monthly_payment(amount, months, nominal,establishment_fee_pct ,establishment_fee, term_fee)
                totalpayment = monthlypayment * months

                candidates.append({
                    "Bank": bank,
                    "Produkt": product,
                    "Nominell rente": nominal,
                    "Effektiv rente": effective,
                    "Etableringsgebyr": establishment_fee,
                    "Termingebyr": term_fee,
                    "Maks løpetid": max_term,
                    "monthly_payment": monthlypayment,
                    "max": max_amount,
                    "total": totalpayment

                })
            except Exception as e:
                print("Feil i rad:", e)


    sorted_loans = sorted(candidates, key=lambda x: x["Effektiv rente"])
    return sorted_loans[:top_n]

def simulate_interest_rate(base_rate: float, month: int) -> float:
    trend = 0.0005 * month 
    noise = random.gauss(0, 0.05)  
    new_rate = base_rate + trend + noise
    return round(max(0, new_rate), 2)  

def simulate_fee(base_fee: float, month: int) -> float:
    inflation_factor = 1 + 0.01 * (month / 12)  
    noise = random.uniform(-5, 5)
    return round(max(0, base_fee * inflation_factor + noise), 2)

def simulate_loan_over_time(path_to_csv: str, months_passed: int):
    csv = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", path_to_csv))
    df = pd.read_csv(csv)
    num_rows_to_update = len(df) // 2
    indices_to_update = random.sample(range(len(df)), num_rows_to_update)

    for idx in indices_to_update:
        row = df.loc[idx]
        base_rate = row["Nominell rente"]
        new_rate = base_rate + random.uniform(-0.015, 0.015) * months_passed
        df.at[idx, "Nominell rente"] = max(new_rate, 0)  
        estab_fee = row["Etableringsgebyr"]
        df.at[idx, "Etableringsgebyr"] = max(estab_fee + random.uniform(0, 10) * months_passed, 0)
        term_fee = row["Termingebyr"]
        df.at[idx, "Termingebyr"] = max(term_fee + random.uniform(0, 5) * months_passed, 0)
    df.to_csv(path_to_csv, index=False)
    print(f"Simulert lån over {months_passed} måneder. Oppdaterte {num_rows_to_update} rader.")
    return {"updated_rows": indices_to_update}

def current_loan(loan: dict, months: int):
    intrest = loan.get("effektiv_rente", 0)
    fee = loan.get("etableringsgebyr", 0)
    fee_percentage = loan.get("etableringsgebyr i %", 0)
    yearly_fee = loan.get("termingebyr", 50)  

    sim_intrest = simulate_interest_rate(intrest, months) + 10
    sim_fee = simulate_fee(fee, months) + 2
    sim_fee_percentage = simulate_fee(fee_percentage, months) + 2
    sim_yearly_fee = simulate_fee(yearly_fee, months) + 2


    loan["effektiv_rente"] = sim_intrest
    loan["etableringsgebyr"] = sim_fee
    loan["etableringsgebyr i %"] = sim_fee_percentage
    loan["termingebyr"] = sim_yearly_fee

    return loan