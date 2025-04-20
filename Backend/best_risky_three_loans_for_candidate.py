import csv
import numpy_financial as npf


def beregn_maanedlig_betaling(
    laanebelop,
    years,
    nominell_rente_aarlig,
    etableringsgebyr_prosent,
    etableringsgebyr_min,
    termingebyr
): 
    nedbetalingstid_maaneder = years * 12

    etableringsgebyr = max(etableringsgebyr_prosent / 100 * laanebelop, etableringsgebyr_min)
    tilbakebetalings_belop = laanebelop + etableringsgebyr 
    maanedlig_rente = nominell_rente_aarlig / 100 / 12

    maanedlig_betaling = tilbakebetalings_belop * (
        maanedlig_rente * (1 + maanedlig_rente) ** nedbetalingstid_maaneder
    ) / ((1 + maanedlig_rente) ** nedbetalingstid_maaneder - 1)

    maanedlig_betaling_med_gebyr = maanedlig_betaling + termingebyr

    return round(maanedlig_betaling_med_gebyr)

def beregn_effektiv_rente(
    laanebelop,
    years,
    nominell_rente_aarlig,
    etableringsgebyr_prosent,
    etableringsgebyr_min,
    termingebyr): 

    nedbetalingstid_maaneder = years * 12
    
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



def find_best_loan(csv_path, age, amount, years, top_n=3):
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

                if not maxlvt < lvt:
                    continue
                if not (min_amount <= amount <= max_amount):
                    continue
                if not (min_age <= age <= max_age):
                    continue
                if years > max_term:
                    continue
                effective = beregn_effektiv_rente(amount, years, nominal,establishment_fee_pct ,establishment_fee, term_fee)
                monthlypayment = beregn_maanedlig_betaling(amount, years, nominal,establishment_fee_pct ,establishment_fee, term_fee)
                totalpayment = monthlypayment * 12 * years
                if effective is None:
                    continue

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

