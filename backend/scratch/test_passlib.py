from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
h = pwd_context.hash("test")
print(f"Hash success: {h}")
