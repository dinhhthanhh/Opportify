import asyncio
import asyncpg

async def fix():
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/jobscholar')
    print("Adding UNIQUE constraint to scholarships.url...")
    try:
        await conn.execute("ALTER TABLE scholarships ADD CONSTRAINT scholarships_url_key UNIQUE (url)")
        print("Done!")
    except Exception as e:
        print(f"Error (maybe already exists): {e}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(fix())
