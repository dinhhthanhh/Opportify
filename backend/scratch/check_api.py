import requests
import json

base_url = "http://127.0.0.1:8000/api"

def check_api(endpoint):
    print(f"\nChecking {endpoint}...")
    try:
        r = requests.get(f"{base_url}/{endpoint}")
        print(f"Status: {r.status_code}")
        data = r.json()
        print(f"Total: {data.get('total')}")
        print(f"Results Count: {len(data.get('results', []))}")
        if data.get('results'):
            print(f"First result title: {data['results'][0].get('title')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_api("jobs/")
    check_api("scholarships/")
