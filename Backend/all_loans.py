import csv
import os
from dotenv import load_dotenv
import requests
from xml.etree import ElementTree

load_dotenv()

def hent_komplett_bankdata():
    url = 'https://www.finansportalen.no/services/feed/v3/bank/boliglan.atom'
    username = os.getenv('FINANSPORTALEN_USERNAME')
    password = os.getenv('FINANSPORTALEN_PASSWORD')

    try:
        response = requests.get(url, auth=(username, password))
        
        if response.status_code == 200:
            root = ElementTree.fromstring(response.content)

            # Prepare CSV file to write
            with open('bank_data_clean.csv', mode='w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                
                # Write headers to CSV
                writer.writerow([
                    "Bank", "Nominell", "Etabl.gebyr", "Termingebyr", "Depotgebyr",
                    "Maks belåningsgrad", "Maks løpetid", "Min Alder", "Max Alder"
                ])
                
                # Iterate through entries and write data
                for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
                    # Grunnleggende data
                    bank_navn = entry.find('{http://www.finansportalen.no/feed/ns/1.0}leverandor_tekst').text if entry.find('{http://www.finansportalen.no/feed/ns/1.0}leverandor_tekst') is not None else "N/A"
                    maks_belaningsgrad = entry.find('{http://www.finansportalen.no/feed/ns/1.0}maks_belaningsgrad')
                    min_alder = entry.find('{http://www.finansportalen.no/feed/ns/1.0}min_alder')
                    maks_alder = entry.find('{http://www.finansportalen.no/feed/ns/1.0}maks_alder')
                    maks_lopetid = entry.find('{http://www.finansportalen.no/feed/ns/1.0}maks_lopetid')
                    
                    # Gebyrer
                    etableringsgebyr = entry.find('{http://www.finansportalen.no/feed/ns/1.0}etableringsgebyr')
                    termingebyr = entry.find('{http://www.finansportalen.no/feed/ns/1.0}termingebyr_1_a')
                    depotgebyr = entry.find('{http://www.finansportalen.no/feed/ns/1.0}depotgebyr')
                    
                    
                    
                    # Renter
                    nominell_rente = entry.find('{http://www.finansportalen.no/feed/ns/1.0}nominell_rente_1_a')
                    
                    # Extract values with None checks
                    nom_rente = float(nominell_rente.text) if nominell_rente is not None and nominell_rente.text is not None else None
                    termingebyr_value = float(''.join(filter(str.isdigit, termingebyr.text))) if termingebyr is not None and termingebyr.text is not None else None
                    etableringsgebyr_value = float(''.join(filter(str.isdigit, etableringsgebyr.text))) if etableringsgebyr is not None and etableringsgebyr.text not in [None, ""] else 0
                    depotgebyr_value = float(depotgebyr.text) if depotgebyr is not None and depotgebyr.text not in [None, ""] else 0
                    belaningsgrad_value = float(maks_belaningsgrad.text.replace('%', '')) if maks_belaningsgrad is not None and maks_belaningsgrad.text is not None else None
                    max_lopetid_value = int(maks_lopetid.text.replace(' år', '')) if maks_lopetid is not None and maks_lopetid.text is not None else None
                    
                    # Min and Max age checks
                    min_age = min_alder.text.split()[-1] if min_alder is not None and min_alder.text is not None else None
                    max_age = maks_alder.text.split()[-1] if maks_alder is not None and maks_alder.text is not None else None
                    
                    # Write row to CSV
                    writer.writerow([
                        bank_navn[:20] + '...' if len(bank_navn) > 20 else bank_navn,  # Trim long bank names
                        nom_rente, 
                        etableringsgebyr_value, 
                        termingebyr_value, 
                        depotgebyr_value,
                        belaningsgrad_value, 
                        max_lopetid_value, 
                        min_age, 
                        max_age
                    ])
                    
            print("Data has been written to 'bank_data_clean.csv'")
            
        else:
            print(f"Feil ved henting av data: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"En feil oppstod: {e}")

if __name__ == "__main__":
    hent_komplett_bankdata()
