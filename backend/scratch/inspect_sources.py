import requests

def inspect(url, name):
    print(f"Inspecting {name} ({url})...")
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        print(f"Status: {r.status_code}")
        print(f"Content Start: {r.text[:1000]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect("https://scholarship-positions.com/feed/", "Scholarship RSS")
    inspect("https://careerviet.vn/vi/tim-viec-lam/tat-ca-viec-lam.html", "CareerViet HTML")
    inspect("https://www.themuse.com/api/public/jobs?page=1", "The Muse API")
