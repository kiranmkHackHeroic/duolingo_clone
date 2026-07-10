from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.path import router as path_router
from app.routers.progress import router as progress_router
from app.routers.leaderboard import router as leaderboard_router
from app.routers.profile import router as profile_router
from app.routers.lessons import router as lessons_router
from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router

app = FastAPI(title="Duolingo Clone API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Duolingo API is healthy"}

app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(path_router)
app.include_router(progress_router)
app.include_router(leaderboard_router)
app.include_router(profile_router)
app.include_router(lessons_router)
