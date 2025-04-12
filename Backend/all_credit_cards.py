import csv
import os
from dotenv import load_dotenv
import requests
from xml.etree import ElementTree

load_dotenv()

def hent_kredittkortdata():
    url = 'https://www.finansportalen.no/services/feed/v3/bank/kredittkort.atom'
    username = os.getenv('FINANSPORTALEN_USERNAME')
    password = os.getenv('FINANSPORTALEN_PASSWORD')

    try:
        response = requests.get(url, auth=(username, password))

        if response.status_code == 200:
            root = ElementTree.fromstring(response.content)
            ns = {'f': 'http://www.finansportalen.no/feed/ns/1.0', 'atom': 'http://www.w3.org/2005/Atom'}

            with open('kredittkort_data.csv', mode='w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)

                writer.writerow([
                    "Bank", "Kortnavn", "Nominell rente (%)", "Årsgebyr", "Termingebyr",
                    "Min inntekt", "Min ramme", "Maks ramme",
                    "Minste innbetaling (%)", "Minste innbetaling (kr)",
                    "Rentefri periode (dager)", "Reiseforsikring", "Reiseforsikring beskrivelse",
                    "Andre fordeler", "Fordeler beskrivelse",
                    "Min alder", "Maks alder",
                    "Valutapåslag (%)", "Uttak utland gebyr", "Uttak innland gebyr"
                ])

                for entry in root.findall('atom:entry', ns):
                    get = lambda tag: entry.find(f'f:{tag}', ns)
                    get_text = lambda tag: (get(tag).text if get(tag) is not None else None)

                    writer.writerow([
                        get_text('leverandor_tekst'),
                        get_text('navn'),
                        get_text('kredittkort_nominell_rente'),
                        get_text('kredittkort_kort_arsgebyr'),
                        get_text('kredittkort_termingebyr'),
                        get_text('kredittkort_min_inntekt'),
                        get_text('kredittkort_min_ramme'),
                        get_text('kredittkort_maks_ramme'),
                        get_text('kredittkort_minstebelop'),
                        get_text('kredittkort_minstebelop_kr'),
                        get_text('kredittkort_rentefri_periode'),
                        get_text('kredittkort_reiseforsikring'),
                        get_text('kredittkort_reiseforsikring_beskrivelse'),
                        get_text('kredittkort_andre_fordeler'),
                        get_text('kredittkort_andre_fordeler_beskrivelse'),
                        get_text('min_alder'),
                        get_text('maks_alder'),
                        get_text('kredittkort_uttak_utland_valutapaslag'),
                        get_text('kredittkort_uttak_utland_transgebyr'),
                        get_text('kredittkort_uttak_egen_bank_i_apningstid_transgebyr')
                    ])

            print("✅ Data skrevet til 'kredittkort_data.csv'")

        else:
            print(f"🚨 Feil ved henting av data: HTTP {response.status_code}")

    except Exception as e:
        print(f"❌ En feil oppstod: {e}")

if __name__ == "__main__":
    hent_kredittkortdata()
