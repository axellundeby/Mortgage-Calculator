import csv
import os
from dotenv import load_dotenv
import requests
from xml.etree import ElementTree

load_dotenv()

def hent_forbrukslan_data():
    url = 'https://www.finansportalen.no/services/feed/v3/bank/smaalan.atom'
    username = os.getenv('FINANSPORTALEN_USERNAME')
    password = os.getenv('FINANSPORTALEN_PASSWORD')

    try:
        response = requests.get(url, auth=(username, password))

        if response.status_code == 200:
            root = ElementTree.fromstring(response.content)
            ns = {
                'atom': 'http://www.w3.org/2005/Atom',
                'f': 'http://www.finansportalen.no/feed/ns/1.0'
            }

            with open('forbrukslan_data_clean.csv', mode='w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    "Bank", "Lånenavn", "Nominell rente", "Etableringsgebyr",
                    "Termingebyr", "Min beløp", "Maks beløp", "Min alder",
                    "Maks alder", "Maks løpetid (år)"
                ])

                for entry in root.findall('atom:entry', ns):
                    def get(tag):
                        return entry.find(f'f:{tag}', ns)

                    def get_text(tag):
                        el = get(tag)
                        return el.text if el is not None and el.text else None

                    etableringsgebyr_text = get_text('etableringsgebyr')
                    if not etableringsgebyr_text:
                        etableringsgebyr_text = get_text('etableringsgebyr_min_belop')
                    if not etableringsgebyr_text:
                        etableringsgebyr_text = get_text('etableringsgebyr_1_min_belop')

                    row = {
                        "Bank": get_text('leverandor_tekst') or "N/A",
                        "Lånenavn": get_text('navn') or "N/A",
                        "Nominell rente": float(get_text('nominell_rente_1') or 0),
                        "Etableringsgebyr": float(etableringsgebyr_text or 0),
                        "Termingebyr": float(get_text('termingebyr') or 0),
                        "Min beløp": float(get_text('min_belop') or 0),
                        "Maks beløp": float(get_text('maks_belop') or 1e9),
                        "Min alder": int(get_text('min_alder') or 0),
                        "Maks alder": int(get_text('maks_alder') or 100),
                        "Maks løpetid (år)": int(get_text('maks_lopetid_ar') or 0),
                    }

                    writer.writerow([
                        row["Bank"],
                        row["Lånenavn"],
                        row["Nominell rente"],
                        row["Etableringsgebyr"],
                        row["Termingebyr"],
                        row["Min beløp"],
                        row["Maks beløp"],
                        row["Min alder"],
                        row["Maks alder"],
                        row["Maks løpetid (år)"],
                    ])

            print("Data er lagret i 'forbrukslan_data_clean.csv'")

        else:
            print(f"Feil ved henting av data: HTTP {response.status_code}")

    except Exception as e:
        print(f"En feil oppstod: {e}")

if __name__ == "__main__":
    hent_forbrukslan_data()
