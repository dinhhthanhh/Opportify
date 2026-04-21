import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/jobscholar')
    rows = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'")
    print("Columns in 'jobs' table:")
    for row in rows:
        print(f"- {row['column_name']}")
    
    rows = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'scholarships'")
    print("\nColumns in 'scholarships' table:")
    for row in rows:
        print(f"- {row['column_name']}")
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
