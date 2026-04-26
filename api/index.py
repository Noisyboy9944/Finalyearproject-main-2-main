# pyre-ignore-all-errors[21, 58]
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header # type: ignore
from dotenv import load_dotenv # type: ignore
from starlette.middleware.cors import CORSMiddleware # type: ignore
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr # type: ignore
from typing import List, Optional, Dict, Any, Union
import uuid
import json
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext # type: ignore
import jwt # type: ignore
from collections import defaultdict
import time

ROOT_DIR = Path(__file__).parent
# Load environment variables
load_dotenv(ROOT_DIR / '.env')
load_dotenv(ROOT_DIR.parent / '.env') # Fallback to root .env

# MongoDB connection — cached globally to survive warm serverless instances
_mongo_client = None
_db = None

def get_db():
    global _mongo_client, _db
    if _mongo_client is None:
        mongo_url = os.environ.get('MONGO_URL', '')
        db_name = os.environ.get('DB_NAME', 'unilearn_db')
        _mongo_client = AsyncIOMotorClient(
            mongo_url,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        _db = _mongo_client[db_name]
    return _db

db = get_db()


# Auth Config
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300
# Default to both common React ports (3000 and 3001) for development ease
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(docs_url=None, redoc_url=None) # Disable docs in prod by default (can be re-enabled if needed)
api_router = APIRouter(prefix="/api")

# --- CORS Middleware (must be added BEFORE routes) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security Middleware ---
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; connect-src *;"
    return response

# --- Simple Rate Limiter ---
login_attempts = defaultdict(list)
login_attempts = defaultdict(list)

def check_rate_limit(key: str, limit: int = 5, window: int = 60):
    now = time.time()
    attempts = [t for t in login_attempts[key] if t > now - window]
    login_attempts[key] = attempts
    if len(attempts) >= limit:
        return False
    login_attempts[key].append(now)
    return True

# --- Models ---

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    role: str = "student"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Pydantic handles __init__ automatically, redundant overrides can cause issues if BaseModel is not resolved

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class Program(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_url: Optional[str] = None
    duration: str = "3 Years"
    students_count: int = 0
    rating: float = 4.5



class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: str
    url: str
    duration: str
    instructor: str
    order: int

class CourseNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: str
    content: str
    order: int

class UserNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    program_id: str
    content: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserNoteInput(BaseModel):
    content: str

class UserNoteResponse(BaseModel):
    id: str
    program_id: str
    content: str
    updated_at: str

class ChatMessageInput(BaseModel):
    message: str
    session_id: str
    context: Optional[str] = None

class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str

class ChatHistoryItem(BaseModel):
    role: str
    content: str
    timestamp: str

# --- Progress & Activity Models ---

class VideoProgressInput(BaseModel):
    video_id: str
    program_id: str

class RatingInput(BaseModel):
    rating: float = Field(ge=1, le=5)

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    options: List[str]
    correct_option_index: int

class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    questions: List[Question]

class QuizSubmit(BaseModel):
    answers: dict[str, int]

class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    program_id: str
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Enrollment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    program_id: str
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Auth Helpers ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Unilearn API Running"}

# Auth
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User.model_validate({
        "email": user.email,
        "password_hash": get_password_hash(user.password),
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "gender": user.gender,
        "address": user.address
    })
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user.email, "role": "student"})
    return {"access_token": access_token, "token_type": "bearer", "user_name": user.full_name}

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    # Basic rate limiting for login
    if not check_rate_limit(user.email):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
        
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user['email'], "role": db_user['role']})
    return {"access_token": access_token, "token_type": "bearer", "user_name": db_user['full_name']}

# Programs
@api_router.get("/programs", response_model=List[Program])
async def get_programs():
    programs = await db.programs.find({}, {"_id": 0}).to_list(100)
    return programs

@api_router.get("/programs/{program_id}", response_model=Program)
async def get_program(program_id: str):
    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


# Videos
@api_router.get("/programs/{program_id}/videos", response_model=List[Video])
async def get_videos(program_id: str):
    videos = await db.videos.find({"program_id": program_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return videos

@api_router.get("/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

# Course Notes
@api_router.get("/programs/{program_id}/notes", response_model=List[CourseNote])
async def get_notes(program_id: str):
    notes = await db.course_notes.find({"program_id": program_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return notes

# --- User Personal Notes ---
@api_router.get("/user-notes/{program_id}", response_model=Optional[UserNoteResponse])
async def get_user_note(program_id: str, user_email: str = Depends(get_current_user)):
    note = await db.user_notes.find_one(
        {"user_email": user_email, "program_id": program_id},
        {"_id": 0}
    )
    if not note:
        return None
    note["updated_at"] = note.get("updated_at", "")
    if isinstance(note["updated_at"], datetime):
        note["updated_at"] = note["updated_at"].isoformat()
    return note

@api_router.put("/user-notes/{program_id}", response_model=UserNoteResponse)
async def save_user_note(program_id: str, note_input: UserNoteInput, user_email: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    existing = await db.user_notes.find_one({"user_email": user_email, "program_id": program_id})
    
    if existing:
        await db.user_notes.update_one(
            {"user_email": user_email, "program_id": program_id},
            {"$set": {"content": note_input.content, "updated_at": now.isoformat()}}
        )
        return {
            "id": existing.get("id", str(uuid.uuid4())),
            "program_id": program_id,
            "content": note_input.content,
            "updated_at": now.isoformat()
        }
    else:
        note = UserNote.model_validate({
            "user_email": user_email,
            "program_id": program_id,
            "content": note_input.content,
            "updated_at": datetime.now(timezone.utc)
        })
        doc = note.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.user_notes.insert_one(doc)
        return {
            "id": note.id,
            "program_id": program_id,
            "content": note_input.content,
            "updated_at": now.isoformat()
        }

# --- Chatbot ---
@api_router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_bot(msg: ChatMessageInput):
    try:
        from groq import AsyncGroq # type: ignore
        
        # We will check GROQ_API_KEY first, and fallback to OPENAI_API_KEY if they just supplied it there
        api_key = os.environ.get("GROQ_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
        
        if not api_key:
            # Return a fallback response if no API key
            return {
                "reply": "Hi! I'm Unilearn's AI Assistant. Currently, I'm in demo mode. To enable full AI functionality, please configure a GROQ_API_KEY or OPENAI_API_KEY in the backend environment. In the meantime, I can help you navigate: check out Programs for courses, explore different subjects, and watch video lectures!",
                "session_id": msg.session_id
            }
        
        # Build context about available courses (resilient - won't crash if DB is down)
        course_context = "Available Programs and Courses:\n- BCA (Bachelor of Computer Applications) — Mobile App Development, Web Technologies, Database Systems, Machine Learning\n- MCA (Master of Computer Applications) — Cloud Computing, Software Engineering, Cybersecurity, DevOps\n- Data Science & Analytics — Python for Data Science, Statistics & Probability, Big Data Technologies"
        try:
            programs = await db.programs.find({}, {"_id": 0, "title": 1, "description": 1, "id": 1}).to_list(100)
            subjects = await db.subjects.find({}, {"_id": 0, "title": 1, "description": 1, "program_id": 1}).to_list(100)
            if programs:
                course_context = "Available Programs and Courses:\n"
                for p in programs:
                    course_context += f"\n- Program: {p['title']} — {p['description']}"
                    prog_subjects = [s for s in subjects if s.get('program_id') == p.get('id', '')]
                    for s in prog_subjects:
                        course_context += f"\n  • Subject: {s['title']} — {s['description']}"
        except Exception as db_err:
            logging.warning(f"Could not fetch course context from DB (using defaults): {db_err}")
        
        system_prompt = f"""You are Unilearn's AI Learning Assistant. You help students navigate the learning platform, find courses, and clear academic doubts.

Your capabilities:
1. Help students find the right courses and programs
2. Explain concepts from any subject (programming, databases, ML, web dev, etc.)
3. Guide students through the platform navigation
4. Answer questions about course content
5. Provide study tips and learning strategies

{course_context}

Platform Navigation Guide:
- Dashboard (/app) - View enrolled programs and progress
- Programs - Click on a program to see its subjects
- Subjects - Click on a subject to see units and videos
- Video Player - Watch lectures with a playlist sidebar

Be friendly, encouraging, and concise. Use emojis sparingly. Format responses with markdown when helpful.
If a student asks about a topic covered in the courses, explain it AND suggest which course to check out.
Keep responses under 300 words unless the student asks for a detailed explanation."""

        # Get chat history from DB (resilient)
        history = []
        try:
            history = await db.chat_history.find(
                {"session_id": msg.session_id}
            ).sort("timestamp", 1).to_list(50)
        except Exception as db_err:
            logging.warning(f"Could not fetch chat history from DB: {db_err}")
        
        groq_client = AsyncGroq(api_key=api_key)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Replay history into the chat to help provide context
        history_list = list(history or [])
        start_idx = max(0, len(history_list) - 20)
        for i in range(start_idx, len(history_list)):
            h = history_list[i]
            if isinstance(h, dict):
                messages.append({"role": str(h.get("role", "user")), "content": str(h.get("content", ""))})
        
        # Build the user message with optional page context
        user_text = msg.message
        if msg.context:
            user_text = f"[User is currently on: {msg.context}]\n\n{msg.message}"
        
        messages.append({"role": "user", "content": user_text})
        
        response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=500
        )
        
        bot_reply = response.choices[0].message.content
        
        # Save to DB (resilient - silently skip if DB is down)
        try:
            now = datetime.now(timezone.utc).isoformat()
            await db.chat_history.insert_one({
                "id": str(uuid.uuid4()),
                "session_id": msg.session_id,
                "role": "user",
                "content": msg.message,
                "timestamp": now
            })
            await db.chat_history.insert_one({
                "id": str(uuid.uuid4()),
                "session_id": msg.session_id,
                "role": "assistant",
                "content": bot_reply,
                "timestamp": now
            })
        except Exception as db_err:
            logging.warning(f"Could not save chat history to DB: {db_err}")

        return {"reply": bot_reply, "session_id": msg.session_id}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}", exc_info=True)
        return {
            "reply": "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
            "session_id": msg.session_id
        }

@api_router.get("/chat/history/{session_id}", response_model=List[ChatHistoryItem])
async def get_chat_history(session_id: str):
    history = await db.chat_history.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1, "timestamp": 1}
    ).sort("timestamp", 1).to_list(100)
    return history

# --- Stats ---
# --- Video Progress & Study Streak ---

@api_router.post("/progress/activity")
async def record_daily_activity(user_email: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    existing_activity = await db.user_activity.find_one({
        "user_email": user_email, "date": today_str
    })
    if not existing_activity:
        await db.user_activity.insert_one({
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "date": today_str,
            "actions": 1
        })
    else:
        await db.user_activity.update_one(
            {"user_email": user_email, "date": today_str},
            {"$inc": {"actions": 1}}
        )
    return {"message": "Activity recorded", "date": today_str}

@api_router.post("/progress/video")
async def mark_video_watched(data: VideoProgressInput, user_email: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    # Check if already marked
    existing = await db.video_progress.find_one({
        "user_email": user_email, "video_id": data.video_id
    })
    if existing:
        return {"message": "Already marked as watched", "already_watched": True}
    
    # Save video progress
    await db.video_progress.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "video_id": data.video_id,
        "program_id": data.program_id,
        "watched_at": now.isoformat(),
        "date": today_str
    })
    
    # Record daily activity for streak
    existing_activity = await db.user_activity.find_one({
        "user_email": user_email, "date": today_str
    })
    if not existing_activity:
        await db.user_activity.insert_one({
            "id": str(uuid.uuid4()),
            "user_email": user_email,
            "date": today_str,
            "actions": 1
        })
    else:
        await db.user_activity.update_one(
            {"user_email": user_email, "date": today_str},
            {"$inc": {"actions": 1}}
        )
    
    return {"message": "Video marked as watched", "already_watched": False}

@api_router.get("/progress/videos/{program_id}")
async def get_program_video_progress(program_id: str, user_email: str = Depends(get_current_user)):
    progress = await db.video_progress.find(
        {"user_email": user_email, "program_id": program_id},
        {"_id": 0, "video_id": 1}
    ).to_list(100)
    watched_ids = [p["video_id"] for p in progress]
    return {"watched_video_ids": watched_ids}

@api_router.get("/progress/dashboard")
async def get_dashboard_progress(user_email: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    # --- Weekly Progress ---
    # Get start of current week (Monday)
    days_since_monday = now.weekday()
    week_start = (now - timedelta(days=days_since_monday)).strftime("%Y-%m-%d")
    
    # Total videos in platform
    total_videos = await db.videos.count_documents({})
    
    # Videos watched this week
    weekly_watched = await db.video_progress.count_documents({
        "user_email": user_email,
        "date": {"$gte": week_start}
    })
    
    # Total videos ever watched by user
    total_watched = await db.video_progress.count_documents({
        "user_email": user_email
    })
    
    # Weekly progress as percentage (goal: watch at least 10 videos per week, or all if less)
    weekly_goal = min(10, total_videos)
    weekly_progress = min(100, int((weekly_watched / max(weekly_goal, 1)) * 100))
    
    # --- Study Streak ---
    # Get all activity dates sorted descending
    activities = await db.user_activity.find(
        {"user_email": user_email},
        {"_id": 0, "date": 1}
    ).sort("date", -1).to_list(365)
    
    activity_dates = set(a["date"] for a in activities)
    
    streak = 0
    check_date = now.date()
    # If user was not active today, check from yesterday
    today_str = check_date.strftime("%Y-%m-%d")
    if today_str not in activity_dates:
        check_date = check_date - timedelta(days=1)
    
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        if date_str in activity_dates:
            streak += 1
            check_date = check_date - timedelta(days=1)
        else:
            break
    
    # --- Overall completion ---
    overall_progress = int((total_watched / max(total_videos, 1)) * 100) if total_videos > 0 else 0
    
    return {
        "weekly_progress": weekly_progress,
        "weekly_watched": weekly_watched,
        "weekly_goal": weekly_goal,
        "study_streak": streak,
        "total_watched": total_watched,
        "total_videos": total_videos,
        "overall_progress": overall_progress
    }

# --- Ratings ---

@api_router.post("/ratings/{program_id}")
async def rate_program(program_id: str, data: RatingInput, user_email: str = Depends(get_current_user)):
    # Check program exists
    program = await db.programs.find_one({"id": program_id})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Upsert user rating
    await db.user_ratings.update_one(
        {"user_email": user_email, "program_id": program_id},
        {"$set": {
            "user_email": user_email,
            "program_id": program_id,
            "rating": data.rating,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Recalculate average rating for this program
    pipeline = [
        {"$match": {"program_id": program_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.user_ratings.aggregate(pipeline).to_list(1)
    
    if result:
        avg_rating = round(result[0]["avg_rating"], 1)
        rating_count = result[0]["count"]
    else:
        avg_rating = data.rating
        rating_count = 1
    
    # Update program with new average
    await db.programs.update_one(
        {"id": program_id},
        {"$set": {"rating": avg_rating, "rating_count": rating_count}}
    )
    
    return {
        "message": "Rating saved",
        "your_rating": data.rating,
        "average_rating": avg_rating,
        "total_ratings": rating_count
    }

@api_router.get("/ratings/{program_id}")
async def get_program_rating(program_id: str, user_email: str = Depends(get_current_user)):
    # Get user's own rating
    user_rating = await db.user_ratings.find_one(
        {"user_email": user_email, "program_id": program_id},
        {"_id": 0, "rating": 1}
    )
    
    # Get average
    pipeline = [
        {"$match": {"program_id": program_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.user_ratings.aggregate(pipeline).to_list(1)
    
    avg_rating = result[0]["avg_rating"] if result else 0
    total_ratings = result[0]["count"] if result else 0
    
    return {
        "your_rating": user_rating["rating"] if user_rating else None,
        "average_rating": round(avg_rating, 1),
        "total_ratings": total_ratings
    }

@api_router.get("/stats")
async def get_stats():
    programs_count = await db.programs.count_documents({})
    subjects_count = await db.subjects.count_documents({})
    videos_count = await db.videos.count_documents({})
    users_count = await db.users.count_documents({})
    return {
        "programs": programs_count,
        "subjects": subjects_count,
        "videos": videos_count,
        "students": users_count + 2847
    }

# --- Quizzes ---
@api_router.get("/programs/{program_id}/quiz")
async def get_program_quiz(program_id: str, user_email: str = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"program_id": program_id}, {"_id": 0})
    if not quiz:
        # Generate dummy quiz if none exists
        quiz = {
            "program_id": program_id,
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "What is the main goal of this program?",
                    "options": ["Introduction", "Advanced Concepts", "Conclusion", "None of the above"],
                    "correct_option_index": 0
                },
                {
                    "id": str(uuid.uuid4()),
                    "text": "Which of these is a best practice?",
                    "options": ["Skipping lectures", "Writing notes", "Ignoring quizzes", "Sleeping during class"],
                    "correct_option_index": 1
                }
            ]
        }
        await db.quizzes.insert_one(quiz.copy())
    
    # Check if user has already passed
    progress = await db.quiz_progress.find_one({
        "user_email": user_email, "program_id": program_id
    }, {"_id": 0})
    
    # Check if all videos are completed
    watched_videos = await db.video_progress.count_documents({"user_email": user_email, "program_id": program_id})
    total_videos = await db.videos.count_documents({"program_id": program_id})
    all_videos_completed = (watched_videos >= total_videos) and (total_videos > 0)
    
    # Hide correct answers from client
    client_quiz: Dict[str, Any] = dict(quiz)
    client_questions: List[Dict[str, Any]] = []
    questions_data = client_quiz.get("questions", [])
    if isinstance(questions_data, list):
        for q in questions_data:
            if isinstance(q, dict):
                client_q = {k: v for k, v in q.items() if k != "correct_option_index"}
                client_questions.append(client_q)
    client_quiz["questions"] = client_questions
    client_quiz["progress"] = progress
    client_quiz["all_videos_completed"] = all_videos_completed
    
    return client_quiz

@api_router.post("/programs/{program_id}/quiz/submit")
async def submit_quiz(program_id: str, data: QuizSubmit, user_email: str = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"program_id": program_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    correct_count: int = 0
    questions = quiz.get("questions", [])
    total: int = len(questions) if isinstance(questions, list) else 0
    
    if isinstance(questions, list):
        for q in questions:
            if isinstance(q, dict):
                q_id = q.get("id")
                if isinstance(q_id, str) and q_id in data.answers:
                    if data.answers[q_id] == q.get("correct_option_index"):
                         correct_count += 1 # type: ignore
            
    passed = correct_count >= (total * 0.5) # 50% to pass
    
    await db.quiz_progress.update_one(
        {"user_email": user_email, "program_id": program_id},
        {"$set": {
            "score": correct_count,
            "total": total,
            "passed": passed,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"score": correct_count, "total": total, "passed": passed}

@api_router.get("/progress/quizzes/{program_id}")
async def get_quiz_progress_for_program(program_id: str, user_email: str = Depends(get_current_user)):
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "program_id": program_id,
        "passed": True
    })
    
    total_units = 1 # 1 quiz per program now
    return {"passed": passed_quizzes, "total": total_units, "is_complete": (passed_quizzes >= total_units)}

# --- Certificates ---
@api_router.get("/certificates/{program_id}/eligibility")
async def check_certificate_eligibility(program_id: str, user_email: str = Depends(get_current_user)):
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "program_id": program_id,
        "passed": True
    })
    
    total_units = 1
    is_eligible = (passed_quizzes >= total_units)
    
    existing = await db.certificates.find_one({
        "user_email": user_email, "program_id": program_id
    }, {"_id": 0})
    
    has_certificate = existing is not None
    
    return {
        "eligible": is_eligible,
        "has_certificate": has_certificate,
        "progress": f"{passed_quizzes}/{total_units} Quizzes Passed",
        "certificate": existing
    }

@api_router.post("/certificates/{program_id}/generate")
async def generate_certificate(program_id: str, user_email: str = Depends(get_current_user)):
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "program_id": program_id,
        "passed": True
    })
    
    total_units = 1
    if passed_quizzes < total_units:
        raise HTTPException(status_code=400, detail="Not eligible for certificate. Please complete all quizzes.")
        
    existing = await db.certificates.find_one({
        "user_email": user_email, "program_id": program_id
    }, {"_id": 0})
    
    if existing:
        return {"message": "Certificate already exists", "certificate": existing}
        
    user = await db.users.find_one({"email": user_email})
    program = await db.programs.find_one({"id": program_id})
        
    cert = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "user_name": user["full_name"],
        "program_id": program_id,
        "program_name": program["title"],
        "issued_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.certificates.insert_one(cert.copy())
    return {"message": "Certificate generated", "certificate": cert}

@api_router.get("/certificates/me")
async def get_my_certificates(user_email: str = Depends(get_current_user)):
    certs = await db.certificates.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    return certs

# --- Enrollments ---
@api_router.post("/enrollments/{program_id}")
async def enroll_in_program(program_id: str, user_email: str = Depends(get_current_user)):
    existing = await db.enrollments.find_one({"user_email": user_email, "program_id": program_id})
    if existing:
        return {"message": "Already enrolled", "enrolled": True}
    enrollment = Enrollment.model_validate({"user_email": user_email, "program_id": program_id})
    await db.enrollments.insert_one(enrollment.model_dump())
    await db.programs.update_one({"id": program_id}, {"$inc": {"students_count": 1}})
    return {"message": "Enrolled successfully", "enrolled": True}

@api_router.get("/enrollments/check/{program_id}")
async def check_enrollment(program_id: str, user_email: str = Depends(get_current_user)):
    existing = await db.enrollments.find_one({"user_email": user_email, "program_id": program_id}, {"_id": 0})
    return {"enrolled": existing is not None}

@api_router.get("/enrollments/me")
async def get_my_enrollments(user_email: str = Depends(get_current_user)):
    enrollments = await db.enrollments.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    result = []
    for enr in enrollments:
        program_id = enr["program_id"]
        program = await db.programs.find_one({"id": program_id}, {"_id": 0})
        if not program:
            continue
            
        # 50% for Videos
        total_videos = await db.videos.count_documents({"program_id": program_id})
        watched_count = await db.video_progress.count_documents({"user_email": user_email, "program_id": program_id})
        video_score = (watched_count / total_videos * 50) if total_videos > 0 else 50
        
        # 50% for Quiz
        passed = await db.quiz_progress.count_documents({"user_email": user_email, "program_id": program_id, "passed": True})
        quiz_score = 50 if passed > 0 else 0
        
        progress_pct = round(video_score + quiz_score, 1)
        result.append({**program, "progress": progress_pct, "enrolled_at": enr["enrolled_at"]})
    return result

@api_router.get("/enrollments/progress/{program_id}")
async def get_program_progress(program_id: str, user_email: str = Depends(get_current_user)):
    # 50% for Videos
    total_videos = await db.videos.count_documents({"program_id": program_id})
    watched = await db.video_progress.find({"user_email": user_email, "program_id": program_id}).to_list(100)
    watched_ids = [w["video_id"] for w in watched]
    video_score = (len(watched_ids) / total_videos * 50) if total_videos > 0 else 50
    
    # 50% for Quiz
    passed = await db.quiz_progress.count_documents({"user_email": user_email, "program_id": program_id, "passed": True})
    quiz_score = 50 if passed > 0 else 0
    
    total_progress = round(video_score + quiz_score, 1)
    all_videos_completed = (len(watched_ids) >= total_videos) and (total_videos > 0)
    
    return {
        "total_units": 1, 
        "passed_quizzes": passed, 
        "progress": total_progress,
        "all_videos_completed": all_videos_completed,
        "watched_ids": watched_ids
    }

# --- Profile ---
@api_router.get("/profile")
async def get_user_profile(user_email: str = Depends(get_current_user)):
    user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get enrolled courses
    enrollments = await db.enrollments.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    program_ids = [e["program_id"] for e in enrollments]
    
    enrolled_programs = await db.programs.find({"id": {"$in": program_ids}}, {"_id": 0}).to_list(100)
    
    certs = await db.certificates.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    
    return {
        "user": user,
        "enrolled_programs": enrolled_programs,
        "certificates": certs
    }

@api_router.put("/profile")
async def update_user_profile(profile_data: dict, user_email: str = Depends(get_current_user)):
    update_fields = {}
    if "full_name" in profile_data:
        update_fields["full_name"] = profile_data["full_name"]
    if "phone_number" in profile_data:
        update_fields["phone_number"] = profile_data["phone_number"]
    if "gender" in profile_data:
        update_fields["gender"] = profile_data["gender"]
    if "address" in profile_data:
        update_fields["address"] = profile_data["address"]
        
    if update_fields:
        await db.users.update_one(
            {"email": user_email},
            {"$set": update_fields}
        )
    user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
    return {"message": "Profile updated", "user": user}

# --- Explore All Courses ---
@api_router.get("/explore")
async def explore_courses():
    programs = await db.programs.find({}, {"_id": 0}).to_list(100)
    return programs

# Seed Data
@api_router.post("/seed")
async def seed_data():
    # Clear all existing data for a fresh start
    collections_to_clear = [
        "programs", "subjects", "units", "videos", "quizzes", 
        "course_notes", "enrollments", "video_progress", 
        "quiz_progress", "user_ratings", "user_notes", 
        "chat_history", "user_activity"
    ]
    for coll in collections_to_clear:
        await db[coll].delete_many({})

    # --- 8 New Programs ---
    new_programs_data = [
        {"title": "Graphic designing", "desc": "Master visual communication, typography, and digital illustration tools."},
        {"title": "C programming", "desc": "Build a strong foundation in low-level programming and memory management."},
        {"title": "Digital marketing", "desc": "Learn SEO, social media strategy, and data-driven marketing techniques."},
        {"title": "Ui/Ux", "desc": "Design intuitive user interfaces and seamless user experiences."},
        {"title": "Python", "desc": "Master the world's most versatile language for web, data, and AI."},
        {"title": "MYSQL", "desc": "Learn relational database design and complex SQL query optimization."},
        {"title": "DSA", "desc": "Master Data Structures and Algorithms for technical interviews and efficient coding."},
        {"title": "Cloud computing", "desc": "Explore AWS, Azure, and modern cloud-native architecture."}
    ]

    for prog_data in new_programs_data:
        program = Program.model_validate({
            "title": prog_data['title'],
            "description": prog_data['desc'],
            "image_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop",
            "duration": "10 Hours",
            "students_count": 0,
            "rating": 5.0
        })
        await db.programs.insert_one(program.model_dump())

        video_sources = {
            "Graphic designing": [
                "https://youtu.be/loQ5X5-67so"
            ],
            "C programming": [
                "https://youtu.be/irqbmMNs2Bo"
            ],
            "Digital marketing": [
                "https://youtu.be/owMvu6ks29E"
            ],
            "Ui/Ux": [
                "https://youtu.be/MBblN98-5lg"
            ],
            "Python": [
                "https://youtu.be/UrsmFxEIp5k"
            ],
            "MYSQL": [
                "https://youtu.be/7S_tz1z_5bA"
            ],
            "DSA": [
                "https://youtu.be/J2fol8eWo64"
            ],
            "Cloud computing": [
                "https://youtu.be/E-bNlmja0j8"
            ]
        }
        
        urls = video_sources.get(program.title, [
            "https://www.youtube.com/watch?v=rfscVS0vtbw",
            "https://www.youtube.com/watch?v=fq4N0hgOWzU",
            "https://www.youtube.com/watch?v=rfscVS0vtbw",
            "https://www.youtube.com/watch?v=fq4N0hgOWzU"
        ])

        # Add a single video per program
        video = Video.model_validate({
            "program_id": program.id,
            "title": program.title,
            "url": urls[0],
            "duration": "20:00",
            "instructor": "Expert Instructor",
            "order": 1
        })
        await db.videos.insert_one(video.model_dump())

        # Add 1 Course Note directly
        note = CourseNote.model_validate({
            "program_id": program.id,
            "title": f"Core Notes for {program.title}",
            "content": f"# {program.title} Core Concepts\n\nThis document covers the fundamental concepts of {program.title}.\n\n## Key Topics\n- Introduction to core principles\n- Basic tools and techniques\n- Real-world applications\n\nStay focused and complete the quiz at the end!",
            "order": 1
        })
        await db.course_notes.insert_one(note.model_dump())

        # Add 1 Quiz directly
        quiz = Quiz.model_validate({
            "program_id": program.id,
            "questions": [
                {
                    "text": f"Which tool is commonly used in {program.title}?",
                    "options": ["Tool X", "Tool Y", "Standard Toolkit", "No tools needed"],
                    "correct_option_index": 2
                }
            ]
        })
        await db.quizzes.insert_one(quiz.model_dump())

    return {"message": "Database reset and seeded with 8 new programs with direct videos and quizzes!"}

@api_router.post("/seed-quizzes")
async def seed_quizzes():
    """Seed the database with proper quiz questions from seed_quizzes.js"""
    quizzes = [
        {
            "program_id": "5a8e0f6b-7b0b-4b1a-9f5e-1b2c3d4e5f6a",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "In brand identity design, what does 'White Space' help achieve?", "options": ["Makes the design smaller", "Reduces printing costs", "Provides visual breathing room and focus", "Allows for more text"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "Which color model is primarily used for print design?", "options": ["RGB", "CMYK", "HSL", "HEX"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "What is the primary difference between 'Kerning' and 'Leading'?", "options": ["Kerning is vertical, Leading is horizontal", "Kerning is between characters, Leading is between lines", "They are the same", "One is for images, one for text"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "A logo that looks the same on both sides is an example of which design principle?", "options": ["Contrast", "Hierarchy", "Symmetry/Balance", "Repetition"], "correct_option_index": 2}
            ]
        },
        {
            "program_id": "8b605dee-0056-441c-a989-b79cc8517aec",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "Which of the following is the correct way to declare a pointer in C?", "options": ["int p;", "int &p;", "int *p;", "pointer int p;"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "What is the result of '5 % 2' in C programming?", "options": ["2.5", "2", "1", "0"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "Which header file is required for using the 'printf' function?", "options": ["conio.h", "math.h", "stdlib.h", "stdio.h"], "correct_option_index": 3},
                {"id": str(uuid.uuid4()), "text": "Every C program must have exactly one ______ function to start execution.", "options": ["start()", "main()", "begin()", "init()"], "correct_option_index": 1}
            ]
        },
        {
            "program_id": "5bfc208f-08ef-44e0-aea9-38548de0b2fc",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "What does SEO stand for in Digital Marketing?", "options": ["Social Engine Optimization", "Search Engine Optimization", "Sales Enablement Office", "Secure Electronic Online"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "Which of these is a form of 'Paid Search' advertising?", "options": ["Organic Search", "Blogging", "PPC (Pay-Per-Click)", "Email Newsletters"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "The 'Marketing Funnel' stage where a customer discovers a brand is called:", "options": ["Conversion", "Loyalty", "Awareness", "Consideration"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "Which metric measures the percentage of people who click a link after seeing an ad?", "options": ["ROI", "CTR (Click-Through Rate)", "CPC", "CPM"], "correct_option_index": 1}
            ]
        },
        {
            "program_id": "5ccd9fb7-426b-4e1d-bcce-5aee4ce14c81",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "Which of these best describes 'User Experience' (UX)?", "options": ["The visual buttons and colors", "The internal logical feel and usability of a product", "The marketing logo", "The server speed"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "What is the primary purpose of a 'Wireframe'?", "options": ["To show final colors", "To test the production code", "To outline the basic structure and layout", "To create a high-fidelity prototype"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "In design, 'Accessibility' refers to:", "options": ["How fast the site loads", "Making the product usable for everyone, including people with disabilities", "Allowing users to access the source code", "Lowering the subscription price"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "Which phase of the Design Thinking process involves observing users?", "options": ["Empathize", "Define", "Ideate", "Prototype"], "correct_option_index": 0}
            ]
        },
        {
            "program_id": "02cff3de-f2b8-43ac-b765-9469724a280d",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "How do you define a function in Python?", "options": ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "Which of the following is used to handle exceptions in Python?", "options": ["try...except", "do...while", "catch...throw", "if...else"], "correct_option_index": 0},
                {"id": str(uuid.uuid4()), "text": "What is the correct syntax to create a list in Python?", "options": ["(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "list<1, 2, 3>"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "Python uses ______ to define blocks of code instead of curly braces.", "options": ["Semicolons", "Parentheses", "Indentation", "Keywords"], "correct_option_index": 2}
            ]
        },
        {
            "program_id": "3b49eadb-6746-4ed9-9c2f-82c155a0041d",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "Which SQL command is used to retrieve data from a database?", "options": ["GET", "OPEN", "FETCH", "SELECT"], "correct_option_index": 3},
                {"id": str(uuid.uuid4()), "text": "What does the 'WHERE' clause do in a SELECT statement?", "options": ["Sorts the data", "Filters records based on a condition", "Deletes the table", "Joins two tables"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "A unique identifier for each record in a table is called a:", "options": ["Foreign Key", "Primary Key", "Index Key", "Master Key"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "Which command removes all records from a table without deleting the table structure?", "options": ["DELETE", "DROP", "TRUNCATE", "REMOVE"], "correct_option_index": 2}
            ]
        },
        {
            "program_id": "5cc69c85-3e1f-4404-87fd-77d114cfbb7d",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "Which data structure follows the LIFO (Last-In-First-Out) principle?", "options": ["Queue", "Linked List", "Stack", "Array"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "What is the time complexity of searching for an element in a Hash Map (average case)?", "options": ["O(n)", "O(log n)", "O(1)", "O(n^2)"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "Which algorithm is a 'Divide and Conquer' sorting algorithm?", "options": ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "In a Linked List, each node contains data and a ______ to the next node.", "options": ["Index", "Reference/Pointer", "Array", "String"], "correct_option_index": 1}
            ]
        },
        {
            "program_id": "6f86fbb0-6802-475f-9120-f75057eec305",
            "questions": [
                {"id": str(uuid.uuid4()), "text": "What does SaaS stand for?", "options": ["Server as a Service", "Software as a Service", "System as a Service", "Security as a Service"], "correct_option_index": 1},
                {"id": str(uuid.uuid4()), "text": "Which cloud service provides a virtual machine instance (like EC2)?", "options": ["IaaS", "PaaS", "SaaS", "Serverless"], "correct_option_index": 0},
                {"id": str(uuid.uuid4()), "text": "In AWS, an 'S3 Bucket' is primarily used for:", "options": ["Running code", "Managing databases", "Object storage", "Networking"], "correct_option_index": 2},
                {"id": str(uuid.uuid4()), "text": "What is 'Cloud Elasticity'?", "options": ["The ability to change colors", "Automatically scaling resources up or down based on demand", "Securing a network with a firewall", "The physical wires in a data center"], "correct_option_index": 1}
            ]
        }
    ]

    count = 0
    for quiz_data in quizzes:
        await db.quizzes.delete_many({"program_id": quiz_data["program_id"]})
        quiz_obj = {"id": str(uuid.uuid4()), "program_id": quiz_data["program_id"], "questions": quiz_data["questions"]}
        await db.quizzes.insert_one(quiz_obj)
        count += 1

    return {"message": f"Successfully seeded {count} quizzes with real questions!"}

app.include_router(api_router)


