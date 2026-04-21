import asyncio
import os
import sys

# Thêm thư mục hiện tại vào path để import được models và db
sys.path.append(os.getcwd())

from db.database import init_database

async def main():
    print("Đang khởi tạo database...")
    try:
        await init_database()
        print("Khởi tạo database thành công!")
    except Exception as e:
        print(f"Lỗi khởi tạo database: {e}")

if __name__ == "__main__":
    asyncio.run(main())
