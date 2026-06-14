import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from routers import jobs, ai, auth, scholarships, profile, recommend, applications
from db.database import init_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo bảng database
    await init_database()
    yield
    # Shutdown cleanup

app = FastAPI(title="Opportify API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(scholarships.router, prefix="/api/v1/scholarships", tags=["scholarships"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile"])
app.include_router(recommend.router, prefix="/api/v1/recommend", tags=["recommend"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])

# Thư mục lưu file tải lên (avatar...) — phục vụ tĩnh tại /uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "avatars"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Opportify API"}

