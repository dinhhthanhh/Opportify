import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("http://localhost:8000/api/v1/applications/my")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test())
