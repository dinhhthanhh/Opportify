import asyncio
import asyncpg

async def fix():
    print("Connecting to DB...")
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/jobscholar')
    print("Adding posted_at column...")
    await conn.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP")
    print("Done!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(fix())
