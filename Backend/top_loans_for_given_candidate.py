import csv
import math

def calculate_effective_interest_rate(nominal_interest, monthly_fee, establishment_fee, deposit_fee, mortgage_value, loan_term_years):
    monthly_interest = nominal_interest / 100 / 12
    effective_rate_without_fees = ((1 + monthly_interest) ** 12 - 1)
    annualized_establishment_fee = establishment_fee / loan_term_years
    total_annual_fees = (
        (monthly_fee * 12) +  
        deposit_fee + 
        annualized_establishment_fee
    )
    fees_as_percentage = total_annual_fees / mortgage_value
    effective_rate = (effective_rate_without_fees + fees_as_percentage) * 100
    return round(effective_rate, 2)
    

def calculate_monthly_payment(mortgage_value, effective_interest_rate, years):
    if not effective_interest_rate:
        return None
        
    effective_interest_rate = float(effective_interest_rate)
    r = effective_interest_rate / 100 / 12  # Monthly interest rate
    n = years * 12  # Total number of payments
    
    # Monthly payment formula
    monthly_payment = (mortgage_value * r * (1 + r)**n) / ((1 + r)**n - 1)
    
    return round(monthly_payment, 3)

def calculate_best_mortgages(client_age, mortgage_value, house_value, repayment_years):
    loans = []

    # Read data from the CSV file
    with open('bank_data_clean.csv', mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        lvt = mortgage_value / house_value
        
        for row in reader:
            bank = row["Bank"]
            nominell_rente = float(row["Nominell"])
            termingebyr = float(row["Termingebyr"])
            etableringsgebyr = float(row["Etabl.gebyr"])
            depotgebyr = float(row["Depotgebyr"])
            maks_belaningsgrad = float(row["Maks belåningsgrad"])
            loan_term_years = float(row["Maks løpetid"])
            min_alder = int(row["Min Alder"]) if row["Min Alder"] else None
            max_alder = int(row["Max Alder"]) if row["Max Alder"] else None
            if loan_term_years <= repayment_years:
                if min_alder is not None and max_alder is not None:
                    if min_alder <= client_age <= max_alder:
                        if lvt <= maks_belaningsgrad / 100: 
                            effektiv_rente = calculate_effective_interest_rate(nominell_rente, termingebyr, etableringsgebyr,depotgebyr ,mortgage_value,loan_term_years)
                            maanedlig_betaling = calculate_monthly_payment(mortgage_value, effektiv_rente, repayment_years)
                            if effektiv_rente is not None and maanedlig_betaling is not None:
                                loans.append({
                                    "Bank": bank,
                                    "Nominell": nominell_rente,
                                    "Etabl.gebyr": etableringsgebyr,
                                    "Termingebyr": termingebyr,
                                    "Maks belåningsgrad": maks_belaningsgrad,
                                    "Depotgebyr": depotgebyr,
                                    "Maks løpetid": loan_term_years,
                                    "Min Alder": min_alder,
                                    "Max Alder": max_alder,
                                    "Effektiv rente": effektiv_rente,
                                    "Månedlig betaling": maanedlig_betaling
                                })

    # Sort the loans by the lowest LTV ratio
    loans.sort(key=lambda x: (x["Maks belåningsgrad"],x["Månedlig betaling"],))


    # Print the top 3 best mortgages
    print(f"Top 3 Best Mortgages based on Effektiv Rente (client age: {client_age}, mortgage value: {mortgage_value}, house value: {house_value}, repayment years: {repayment_years}):")
    print(f"{'Bank':<25} {'Nominell rente (%)':<20} {'Effektiv rente (%)':<20} {'Etabl.gebyr':<15} {'Termingebyr':<15} {'Maks belåningsgrad':<20} {'Månedlig betaling':<20}")
    print("-" * 110)
        
    for i in range(3, len(loans)):
        loan = loans[i]
        print(f"{loan['Bank']:<25} {loan['Nominell']:<20} {loan['Effektiv rente']:<20} {loan['Etabl.gebyr']:<15} {loan['Termingebyr']:<15} {loan['Maks belåningsgrad']:<20} {loan['Månedlig betaling']:<20}")

if __name__ == "__main__":
    person1 = {
        "name": "Maja",
        "age": 33,
        "mortgage_value": 7_800_000,
        "house_value": 8_500_000,
        "repayment_years": 15
    }
    person2 = {
        "name": "Emil",
        "age": 22,
        "mortgage_value": 3_000_000,
        "house_value": 5_500_000,
        "repayment_years": 25
    } 
    # calculate_best_mortgages(
    #     client_age=person1["age"],
    #     mortgage_value=person2["mortgage_value"],
    #     house_value=person1["house_value"],
    #     repayment_years=person2["repayment_years"]
    # )


    calculate_best_mortgages(
        client_age=person2["age"],
        mortgage_value=person2["mortgage_value"],
        house_value=person2["house_value"],
        repayment_years=person2["repayment_years"]
    )
    

#DinBANK.no(Sparebank...   5.82                 5.98                 0.0             0.0             50.0                 19292.382   
#Handelsbanken AB NUF      5.4                  5.55                 0.0             45.0            60.0                 18512.311  