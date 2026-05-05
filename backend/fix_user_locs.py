import asyncio
from sqlalchemy import update
from db.database import engine
from models.user import User

async def update_locs():
    async with engine.begin() as conn:
        await conn.execute(
            update(User).where(User.username == 'admin').values(latitude='21.0285', longitude='105.8542')
        )
        await conn.execute(
            update(User).where(User.username == 'student').values(latitude='10.7626', longitude='106.6602')
        )
        print('Updated locations for admin and student')

if __name__ == "__main__":
    asyncio.run(update_locs())
