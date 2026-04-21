import requests
import json

url = "https://u97s6s8i86-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.22.1)%3B%20Browser%20(lite)"
headers = {
    "X-Algolia-API-Key": "b36440f82dfdf77180ba30e461a33716",
    "X-Algolia-Application-Id": "U97S6S8I86",
    "Content-Type": "application/json",
}

payload = {
    "requests": [
        {
            "indexName": "vnw_job_v2",
            "params": "query=&hitsPerPage=20&page=0&facets=%5B%22*%22%5D"
        }
    ]
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        hits = data.get("results", [{}])[0].get("hits", [])
        print(f"Success! Found {len(hits)} hits.")
    else:
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
