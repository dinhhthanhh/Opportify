import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/jobscholar')
        j = await conn.fetchval('SELECT count(*) FROM jobs')
        s = await conn.fetchval('SELECT count(*) FROM scholarships')
        print(f"Jobs: {j}")
        print(f"Scholarships: {s}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
