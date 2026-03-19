from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from collections import defaultdict
import time

ROOT_DIR = Path(__file__).parent
# Load environment variables
load_dotenv(ROOT_DIR / '.env')
load_dotenv(ROOT_DIR.parent / '.env') # Fallback to root .env

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth Config
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300
# Default to both common React ports (3000 and 3001) for development ease
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001").split(",")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(docs_url=None, redoc_url=None) # Disable docs in prod by default (can be re-enabled if needed)
api_router = APIRouter(prefix="/api")

# --- Security Middleware ---
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; connect-src 'self' http://localhost:8000 https://api.groq.com;"
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
    role: str = "student"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

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

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: str
    description: str
    icon: Optional[str] = "Book"

class Unit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    title: str
    order: int

class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    unit_id: str
    title: str
    url: str
    duration: str
    instructor: str
    order: int

class CourseNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    unit_id: str
    title: str
    content: str
    order: int

class UserNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    unit_id: str
    content: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserNoteInput(BaseModel):
    content: str

class UserNoteResponse(BaseModel):
    id: str
    unit_id: str
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
    unit_id: str

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
    unit_id: str
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
    
    user_obj = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        full_name=user.full_name
    )
    
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

# Subjects
@api_router.get("/programs/{program_id}/subjects", response_model=List[Subject])
async def get_subjects(program_id: str):
    subjects = await db.subjects.find({"program_id": program_id}, {"_id": 0}).to_list(100)
    return subjects

@api_router.get("/subjects/{subject_id}", response_model=Subject)
async def get_subject(subject_id: str):
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

# Units
@api_router.get("/subjects/{subject_id}/units", response_model=List[Unit])
async def get_units(subject_id: str):
    units = await db.units.find({"subject_id": subject_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return units

@api_router.get("/units/{unit_id}", response_model=Unit)
async def get_unit(unit_id: str):
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit

# Videos
@api_router.get("/units/{unit_id}/videos", response_model=List[Video])
async def get_videos(unit_id: str):
    videos = await db.videos.find({"unit_id": unit_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return videos

@api_router.get("/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

# Course Notes
@api_router.get("/units/{unit_id}/notes", response_model=List[CourseNote])
async def get_notes(unit_id: str):
    notes = await db.course_notes.find({"unit_id": unit_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return notes

# --- User Personal Notes ---
@api_router.get("/user-notes/{unit_id}", response_model=Optional[UserNoteResponse])
async def get_user_note(unit_id: str, user_email: str = Depends(get_current_user)):
    note = await db.user_notes.find_one(
        {"user_email": user_email, "unit_id": unit_id},
        {"_id": 0}
    )
    if not note:
        return None
    note["updated_at"] = note.get("updated_at", "")
    if isinstance(note["updated_at"], datetime):
        note["updated_at"] = note["updated_at"].isoformat()
    return note

@api_router.put("/user-notes/{unit_id}", response_model=UserNoteResponse)
async def save_user_note(unit_id: str, note_input: UserNoteInput, user_email: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    existing = await db.user_notes.find_one({"user_email": user_email, "unit_id": unit_id})
    
    if existing:
        await db.user_notes.update_one(
            {"user_email": user_email, "unit_id": unit_id},
            {"$set": {"content": note_input.content, "updated_at": now.isoformat()}}
        )
        return {
            "id": existing.get("id", str(uuid.uuid4())),
            "unit_id": unit_id,
            "content": note_input.content,
            "updated_at": now.isoformat()
        }
    else:
        note = UserNote(
            user_email=user_email,
            unit_id=unit_id,
            content=note_input.content,
            updated_at=now
        )
        doc = note.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.user_notes.insert_one(doc)
        return {
            "id": note.id,
            "unit_id": unit_id,
            "content": note_input.content,
            "updated_at": now.isoformat()
        }

# --- Chatbot ---
@api_router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_bot(msg: ChatMessageInput):
    try:
        from groq import AsyncGroq
        
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
        
        # Replay history into the chat
        for h in history[-20:]:  # Last 20 messages for context
            messages.append({"role": h["role"], "content": h["content"]})
        
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
        "unit_id": data.unit_id,
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

@api_router.get("/progress/videos/{unit_id}")
async def get_unit_video_progress(unit_id: str, user_email: str = Depends(get_current_user)):
    progress = await db.video_progress.find(
        {"user_email": user_email, "unit_id": unit_id},
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
@api_router.get("/units/{unit_id}/quiz")
async def get_unit_quiz(unit_id: str, user_email: str = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"unit_id": unit_id}, {"_id": 0})
    if not quiz:
        # Generate dummy quiz if none exists
        quiz = {
            "id": str(uuid.uuid4()),
            "unit_id": unit_id,
            "questions": [
                {
                    "id": str(uuid.uuid4()),
                    "text": "What is the primary topic of this unit?",
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
        await db.quizzes.insert_one(quiz)
        if "_id" in quiz:
            del quiz["_id"]
    
    # Check if user has already passed
    progress = await db.quiz_progress.find_one({
        "user_email": user_email, "unit_id": unit_id
    }, {"_id": 0})
    
    # Hide correct answers from client
    client_quiz = quiz.copy()
    client_questions = []
    for q in quiz["questions"]:
        client_q = {k: v for k, v in q.items() if k != "correct_option_index"}
        client_questions.append(client_q)
    client_quiz["questions"] = client_questions
    client_quiz["progress"] = progress
    
    return client_quiz

@api_router.post("/units/{unit_id}/quiz/submit")
async def submit_quiz(unit_id: str, data: QuizSubmit, user_email: str = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"unit_id": unit_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    correct_count = 0
    total = len(quiz["questions"])
    
    for q in quiz["questions"]:
        q_id = q["id"]
        if q_id in data.answers and data.answers[q_id] == q["correct_option_index"]:
            correct_count += 1
            
    passed = correct_count >= (total * 0.5) # 50% to pass
    
    await db.quiz_progress.update_one(
        {"user_email": user_email, "unit_id": unit_id},
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
    subjects = await db.subjects.find({"program_id": program_id}).to_list(100)
    subject_ids = [s["id"] for s in subjects]
    
    units = await db.units.find({"subject_id": {"$in": subject_ids}}).to_list(1000)
    unit_ids = [u["id"] for u in units]
    total_units = len(unit_ids)
    
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "unit_id": {"$in": unit_ids},
        "passed": True
    })
    
    return {"passed": passed_quizzes, "total": total_units, "is_complete": (passed_quizzes >= total_units and total_units > 0)}

# --- Certificates ---
@api_router.get("/certificates/{program_id}/eligibility")
async def check_certificate_eligibility(program_id: str, user_email: str = Depends(get_current_user)):
    subjects = await db.subjects.find({"program_id": program_id}).to_list(100)
    subject_ids = [s["id"] for s in subjects]
    
    units = await db.units.find({"subject_id": {"$in": subject_ids}}).to_list(1000)
    unit_ids = [u["id"] for u in units]
    total_units = len(unit_ids)
    
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "unit_id": {"$in": unit_ids},
        "passed": True
    })
    
    is_eligible = (passed_quizzes >= total_units and total_units > 0)
    
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
    subjects = await db.subjects.find({"program_id": program_id}).to_list(100)
    subject_ids = [s["id"] for s in subjects]
    units = await db.units.find({"subject_id": {"$in": subject_ids}}).to_list(1000)
    unit_ids = [u["id"] for u in units]
    total_units = len(unit_ids)
    
    passed_quizzes = await db.quiz_progress.count_documents({
        "user_email": user_email,
        "unit_id": {"$in": unit_ids},
        "passed": True
    })
    
    if passed_quizzes < total_units or total_units == 0:
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
    enrollment = Enrollment(user_email=user_email, program_id=program_id)
    await db.enrollments.insert_one(enrollment.dict())
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
        program = await db.programs.find_one({"id": enr["program_id"]}, {"_id": 0})
        if not program:
            continue
        subjects = await db.subjects.find({"program_id": enr["program_id"]}).to_list(100)
        subject_ids = [s["id"] for s in subjects]
        units = await db.units.find({"subject_id": {"$in": subject_ids}}).to_list(1000)
        unit_ids = [u["id"] for u in units]
        total_units = len(unit_ids)
        passed = await db.quiz_progress.count_documents({"user_email": user_email, "unit_id": {"$in": unit_ids}, "passed": True})
        progress_pct = int((passed / total_units) * 100) if total_units > 0 else 0
        result.append({**program, "progress": progress_pct, "enrolled_at": enr["enrolled_at"]})
    return result

@api_router.get("/enrollments/progress/{program_id}")
async def get_program_progress(program_id: str, user_email: str = Depends(get_current_user)):
    subjects = await db.subjects.find({"program_id": program_id}).to_list(100)
    subject_ids = [s["id"] for s in subjects]
    units = await db.units.find({"subject_id": {"$in": subject_ids}}).to_list(1000)
    unit_ids = [u["id"] for u in units]
    total_units = len(unit_ids)
    passed = await db.quiz_progress.count_documents({"user_email": user_email, "unit_id": {"$in": unit_ids}, "passed": True})
    progress_pct = int((passed / total_units) * 100) if total_units > 0 else 0
    return {"total_units": total_units, "passed_quizzes": passed, "progress": progress_pct}

# --- Profile ---
@api_router.get("/profile")
async def get_user_profile(user_email: str = Depends(get_current_user)):
    user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get enrolled courses
    progress_records = await db.user_progress.find({"user_email": user_email}).to_list(1000)
    unit_ids = [p["unit_id"] for p in progress_records]
    
    units = await db.units.find({"id": {"$in": unit_ids}}).to_list(1000)
    subject_ids = list(set([u["subject_id"] for u in units]))
    
    subjects = await db.subjects.find({"id": {"$in": subject_ids}}).to_list(1000)
    program_ids = list(set([s["program_id"] for s in subjects]))
    
    enrolled_programs = await db.programs.find({"id": {"$in": program_ids}}, {"_id": 0}).to_list(100)
    
    certs = await db.certificates.find({"user_email": user_email}, {"_id": 0}).to_list(100)
    
    return {
        "user": user,
        "enrolled_programs": enrolled_programs,
        "certificates": certs
    }

@api_router.put("/profile")
async def update_user_profile(profile_data: dict, user_email: str = Depends(get_current_user)):
    if "full_name" in profile_data:
        await db.users.update_one(
            {"email": user_email},
            {"$set": {"full_name": profile_data["full_name"]}}
        )
    user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
    return {"message": "Profile updated", "user": user}

# --- Explore All Courses ---
@api_router.get("/explore")
async def explore_courses():
    programs = await db.programs.find({}, {"_id": 0}).to_list(100)
    result = []
    for p in programs:
        subjects = await db.subjects.find({"program_id": p["id"]}, {"_id": 0}).to_list(100)
        p["subjects"] = subjects
        p["subjects_count"] = len(subjects)
        result.append(p)
    return result

# Seeding Endpoint
@api_router.post("/seed")
async def seed_data():
    if await db.programs.count_documents({}) > 0:
        return {"message": "Database already seeded"}

    # ========== PROGRAM 1: BCA ==========
    bca = Program(
        title="Bachelor of Computer Applications (BCA)",
        description="A 3-year undergraduate course designed to provide students with a strong foundation in computer applications and software development.",
        image_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop",
        duration="3 Years",
        students_count=1245,
        rating=4.7#have to the rating dynamic
    )
    await db.programs.insert_one(bca.model_dump())

    # --- BCA Subjects ---
    bca_subjects = [
        {"title": "Mobile App Development", "desc": "Learn to build Android & iOS apps using Flutter and React Native.", "icon": "DeviceMobile"},
        {"title": "Web Technologies", "desc": "Master HTML, CSS, JavaScript, React, and modern web frameworks.", "icon": "Globe"},
        {"title": "Database Systems", "desc": "SQL, NoSQL, data modeling, and database administration.", "icon": "Database"},
        {"title": "Machine Learning", "desc": "Introduction to AI, ML algorithms, and data science fundamentals.", "icon": "Brain"}
    ]
    
    created_bca_subjects = []
    for s in bca_subjects:
        subj = Subject(program_id=bca.id, title=s['title'], description=s['desc'], icon=s['icon'])
        await db.subjects.insert_one(subj.model_dump())
        created_bca_subjects.append(subj)

    # --- Mobile App Development Units & Videos ---
    mobile_units = [
        {
            "title": "Introduction to Mobile Computing",
            "videos": [
                {"title": "What is Mobile Computing?", "url": "https://www.youtube.com/watch?v=fq4N0hgOWzU", "duration": "45:00", "instructor": "Dr. Sarah Johnson"},
                {"title": "Mobile OS Architecture", "url": "https://www.youtube.com/watch?v=x0uinJvhNxI", "duration": "38:00", "instructor": "Dr. Sarah Johnson"},
            ],
            "notes": [
                {"title": "Mobile Computing Overview", "content": "# Mobile Computing\n\nMobile computing refers to the use of portable computing devices in conjunction with mobile communication technologies.\n\n## Key Concepts\n- **Portability**: Devices can be carried anywhere\n- **Connectivity**: Always connected via cellular or WiFi\n- **Social Interactivity**: Real-time communication\n\n## Mobile OS Landscape\n- Android (Linux-based, Google)\n- iOS (Apple's proprietary OS)\n- Cross-platform frameworks: Flutter, React Native"}
            ]
        },
        {
            "title": "UI Design in Flutter",
            "videos": [
                {"title": "Flutter Widget Tree Basics", "url": "https://www.youtube.com/watch?v=fq4N0hgOWzU", "duration": "50:00", "instructor": "Dr. Sarah Johnson"},
                {"title": "Layouts and Responsive Design", "url": "https://www.youtube.com/watch?v=x0uinJvhNxI", "duration": "42:00", "instructor": "Dr. Sarah Johnson"},
            ],
            "notes": [
                {"title": "Flutter UI Fundamentals", "content": "# Flutter UI Design\n\n## Widget Tree\nEverything in Flutter is a widget. Widgets are composed in a tree structure.\n\n## Common Widgets\n- `Container` - Box model widget\n- `Row` / `Column` - Flex layouts\n- `Stack` - Overlay widgets\n- `ListView` - Scrollable lists\n\n## Responsive Design\nUse `MediaQuery`, `LayoutBuilder`, and `Flexible` widgets for responsive layouts."}
            ]
        },
        {
            "title": "State Management",
            "videos": [
                {"title": "Understanding State in Flutter", "url": "https://www.youtube.com/watch?v=fq4N0hgOWzU", "duration": "55:00", "instructor": "Dr. Sarah Johnson"},
                {"title": "Provider & Riverpod Patterns", "url": "https://www.youtube.com/watch?v=x0uinJvhNxI", "duration": "48:00", "instructor": "Dr. Sarah Johnson"},
            ],
            "notes": [
                {"title": "State Management Guide", "content": "# State Management in Flutter\n\n## Types of State\n- **Ephemeral State**: UI-only state (animations, page index)\n- **App State**: Shared across widgets (user data, cart)\n\n## Popular Solutions\n1. **setState** - Built-in, simple\n2. **Provider** - Recommended by Flutter team\n3. **Riverpod** - Modern, compile-safe\n4. **BLoC** - Business Logic Component pattern"}
            ]
        },
        {
            "title": "API Integration & Deployment",
            "videos": [
                {"title": "REST API Integration in Flutter", "url": "https://www.youtube.com/watch?v=fq4N0hgOWzU", "duration": "52:00", "instructor": "Dr. Sarah Johnson"},
                {"title": "Publishing to App Stores", "url": "https://www.youtube.com/watch?v=x0uinJvhNxI", "duration": "40:00", "instructor": "Dr. Sarah Johnson"},
            ],
            "notes": [
                {"title": "API Integration", "content": "# API Integration\n\n## HTTP Package\n```dart\nimport 'package:http/http.dart' as http;\n\nfinal response = await http.get(Uri.parse('https://api.example.com/data'));\n```\n\n## Best Practices\n- Use repository pattern\n- Handle loading, error, and success states\n- Implement retry logic\n- Cache responses when possible"}
            ]
        }
    ]

    for i, u_data in enumerate(mobile_units):
        unit = Unit(subject_id=created_bca_subjects[0].id, title=u_data['title'], order=i+1)
        await db.units.insert_one(unit.model_dump())
        for j, v in enumerate(u_data['videos']):
            video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
            await db.videos.insert_one(video.model_dump())
        for k, n in enumerate(u_data.get('notes', [])):
            note = CourseNote(unit_id=unit.id, title=n['title'], content=n['content'], order=k+1)
            await db.course_notes.insert_one(note.model_dump())

    # --- Web Technologies Units & Videos ---
    web_units = [
        {
            "title": "HTML5 & Semantic Markup",
            "videos": [
                {"title": "HTML5 Document Structure", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "35:00", "instructor": "Prof. Michael Chen"},
                {"title": "Semantic Elements & Accessibility", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "40:00", "instructor": "Prof. Michael Chen"},
            ],
            "notes": [{"title": "HTML5 Fundamentals", "content": "# HTML5 Fundamentals\n\n## Semantic Elements\n- `<header>`, `<nav>`, `<main>`, `<footer>`\n- `<article>`, `<section>`, `<aside>`\n\n## New Form Types\n- `email`, `date`, `range`, `color`\n\n## Multimedia\n- `<video>`, `<audio>`, `<canvas>`"}]
        },
        {
            "title": "CSS3 & Modern Layouts",
            "videos": [
                {"title": "Flexbox Deep Dive", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "45:00", "instructor": "Prof. Michael Chen"},
                {"title": "CSS Grid & Responsive Design", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "50:00", "instructor": "Prof. Michael Chen"},
            ],
            "notes": [{"title": "CSS Modern Layouts", "content": "# CSS3 Modern Layouts\n\n## Flexbox\nOne-dimensional layout system.\n```css\n.container { display: flex; gap: 1rem; }\n```\n\n## CSS Grid\nTwo-dimensional layout system.\n```css\n.grid { display: grid; grid-template-columns: repeat(3, 1fr); }\n```\n\n## Media Queries\n```css\n@media (max-width: 768px) { /* mobile styles */ }\n```"}]
        },
        {
            "title": "JavaScript ES6+ Essentials",
            "videos": [
                {"title": "Arrow Functions & Destructuring", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "42:00", "instructor": "Prof. Michael Chen"},
                {"title": "Async/Await & Promises", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "48:00", "instructor": "Prof. Michael Chen"},
            ],
            "notes": [{"title": "JavaScript ES6+", "content": "# JavaScript ES6+ Features\n\n## Key Features\n- **Arrow Functions**: `const add = (a, b) => a + b;`\n- **Destructuring**: `const { name, age } = person;`\n- **Spread Operator**: `const arr2 = [...arr1, 4, 5];`\n- **Template Literals**: `` `Hello ${name}` ``\n- **Promises & Async/Await**: Asynchronous programming"}]
        },
        {
            "title": "React.js & Modern Frameworks",
            "videos": [
                {"title": "React Components & Hooks", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "55:00", "instructor": "Prof. Michael Chen"},
                {"title": "State Management with Context & Redux", "url": "https://www.youtube.com/watch?v=kUMe1FH4CHE", "duration": "50:00", "instructor": "Prof. Michael Chen"},
            ],
            "notes": [{"title": "React.js Guide", "content": "# React.js\n\n## Core Concepts\n- **Components**: Reusable UI building blocks\n- **JSX**: HTML-like syntax in JavaScript\n- **Props**: Data passed to components\n- **State**: Component's internal data\n\n## Hooks\n- `useState` - State management\n- `useEffect` - Side effects\n- `useContext` - Global state\n- `useMemo` - Memoization"}]
        }
    ]

    for i, u_data in enumerate(web_units):
        unit = Unit(subject_id=created_bca_subjects[1].id, title=u_data['title'], order=i+1)
        await db.units.insert_one(unit.model_dump())
        for j, v in enumerate(u_data['videos']):
            video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
            await db.videos.insert_one(video.model_dump())
        for k, n in enumerate(u_data.get('notes', [])):
            note = CourseNote(unit_id=unit.id, title=n['title'], content=n['content'], order=k+1)
            await db.course_notes.insert_one(note.model_dump())

    # --- Database Systems Units & Videos ---
    db_units = [
        {
            "title": "Introduction to Databases",
            "videos": [
                {"title": "What are Databases?", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "38:00", "instructor": "Dr. Emily Watson"},
                {"title": "DBMS Architecture", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "42:00", "instructor": "Dr. Emily Watson"},
            ],
            "notes": [{"title": "Database Fundamentals", "content": "# Database Systems\n\n## What is a Database?\nAn organized collection of structured data stored electronically.\n\n## Types\n- **Relational (SQL)**: MySQL, PostgreSQL, SQLite\n- **NoSQL**: MongoDB, Redis, Cassandra\n- **Graph**: Neo4j\n\n## ACID Properties\n- **Atomicity**: All or nothing\n- **Consistency**: Valid state transitions\n- **Isolation**: Concurrent independence\n- **Durability**: Permanent once committed"}]
        },
        {
            "title": "SQL & Relational Databases",
            "videos": [
                {"title": "SQL CRUD Operations", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "50:00", "instructor": "Dr. Emily Watson"},
                {"title": "JOINs, Subqueries & Indexes", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "55:00", "instructor": "Dr. Emily Watson"},
            ],
            "notes": [{"title": "SQL Essentials", "content": "# SQL Essentials\n\n## CRUD Operations\n```sql\nSELECT * FROM users WHERE age > 21;\nINSERT INTO users (name, age) VALUES ('Alice', 25);\nUPDATE users SET age = 26 WHERE name = 'Alice';\nDELETE FROM users WHERE name = 'Alice';\n```\n\n## JOINs\n- INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN\n\n## Indexing\nIndexes speed up queries but slow down writes."}]
        },
        {
            "title": "NoSQL & MongoDB",
            "videos": [
                {"title": "MongoDB Document Model", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "45:00", "instructor": "Dr. Emily Watson"},
                {"title": "Aggregation Pipelines", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "48:00", "instructor": "Dr. Emily Watson"},
            ],
            "notes": [{"title": "MongoDB Guide", "content": "# MongoDB & NoSQL\n\n## Document Model\nData is stored as flexible JSON-like documents (BSON).\n\n```javascript\ndb.users.insertOne({\n  name: 'Alice',\n  age: 25,\n  hobbies: ['reading', 'coding']\n});\n```\n\n## When to Use NoSQL\n- Flexible schema needed\n- Horizontal scaling required\n- Real-time applications\n- Content management systems"}]
        },
        {
            "title": "Database Design & Optimization",
            "videos": [
                {"title": "ER Diagrams & Normalization", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "52:00", "instructor": "Dr. Emily Watson"},
                {"title": "Query Optimization Techniques", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "46:00", "instructor": "Dr. Emily Watson"},
            ],
            "notes": [{"title": "DB Design Principles", "content": "# Database Design\n\n## Normal Forms\n1. **1NF**: Atomic values, unique rows\n2. **2NF**: No partial dependencies\n3. **3NF**: No transitive dependencies\n\n## ER Diagrams\nVisual representation of entities and relationships.\n\n## Optimization\n- Proper indexing\n- Query analysis with EXPLAIN\n- Denormalization for read-heavy workloads\n- Connection pooling"}]
        }
    ]

    for i, u_data in enumerate(db_units):
        unit = Unit(subject_id=created_bca_subjects[2].id, title=u_data['title'], order=i+1)
        await db.units.insert_one(unit.model_dump())
        for j, v in enumerate(u_data['videos']):
            video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
            await db.videos.insert_one(video.model_dump())
        for k, n in enumerate(u_data.get('notes', [])):
            note = CourseNote(unit_id=unit.id, title=n['title'], content=n['content'], order=k+1)
            await db.course_notes.insert_one(note.model_dump())

    # --- Machine Learning Units & Videos ---
    ml_units = [
        {
            "title": "Introduction to AI & ML",
            "videos": [
                {"title": "What is Artificial Intelligence?", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "40:00", "instructor": "Dr. Priya Sharma"},
                {"title": "Types of Machine Learning", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "45:00", "instructor": "Dr. Priya Sharma"},
            ],
            "notes": [{"title": "AI & ML Overview", "content": "# Artificial Intelligence & Machine Learning\n\n## AI vs ML vs DL\n- **AI**: Machines that mimic human intelligence\n- **ML**: AI subset that learns from data\n- **DL**: ML subset using neural networks\n\n## Types of ML\n1. **Supervised Learning**: Labeled data (classification, regression)\n2. **Unsupervised Learning**: Unlabeled data (clustering)\n3. **Reinforcement Learning**: Reward-based learning"}]
        },
        {
            "title": "Supervised Learning Algorithms",
            "videos": [
                {"title": "Linear & Logistic Regression", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "55:00", "instructor": "Dr. Priya Sharma"},
                {"title": "Decision Trees & Random Forests", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "50:00", "instructor": "Dr. Priya Sharma"},
            ],
            "notes": [{"title": "Supervised Learning", "content": "# Supervised Learning\n\n## Regression\n- **Linear Regression**: y = mx + b\n- **Polynomial Regression**: Higher degree curves\n\n## Classification\n- **Logistic Regression**: Binary classification\n- **Decision Trees**: Rule-based splitting\n- **Random Forests**: Ensemble of decision trees\n- **SVM**: Support Vector Machines\n\n## Evaluation Metrics\n- Accuracy, Precision, Recall, F1-Score\n- Confusion Matrix, ROC Curve"}]
        },
        {
            "title": "Neural Networks & Deep Learning",
            "videos": [
                {"title": "Perceptrons & Activation Functions", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "52:00", "instructor": "Dr. Priya Sharma"},
                {"title": "Building a Neural Network with Python", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "58:00", "instructor": "Dr. Priya Sharma"},
            ],
            "notes": [{"title": "Neural Networks", "content": "# Neural Networks\n\n## Architecture\n- **Input Layer**: Receives features\n- **Hidden Layers**: Process information\n- **Output Layer**: Produces predictions\n\n## Activation Functions\n- ReLU: max(0, x)\n- Sigmoid: 1/(1+e^-x)\n- Softmax: Multi-class output\n\n## Training\n- Forward propagation\n- Loss calculation\n- Backpropagation\n- Gradient descent optimization"}]
        },
        {
            "title": "ML in Practice",
            "videos": [
                {"title": "Data Preprocessing & Feature Engineering", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "48:00", "instructor": "Dr. Priya Sharma"},
                {"title": "Model Deployment with Flask & Docker", "url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "duration": "45:00", "instructor": "Dr. Priya Sharma"},
            ],
            "notes": [{"title": "Practical ML", "content": "# ML in Practice\n\n## Data Pipeline\n1. Data Collection\n2. Data Cleaning\n3. Feature Engineering\n4. Model Selection\n5. Training & Evaluation\n6. Deployment\n\n## Tools\n- **Python**: NumPy, Pandas, Scikit-learn\n- **Deep Learning**: TensorFlow, PyTorch\n- **Visualization**: Matplotlib, Seaborn\n- **Deployment**: Flask, Docker, AWS"}]
        }
    ]

    for i, u_data in enumerate(ml_units):
        unit = Unit(subject_id=created_bca_subjects[3].id, title=u_data['title'], order=i+1)
        await db.units.insert_one(unit.model_dump())
        for j, v in enumerate(u_data['videos']):
            video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
            await db.videos.insert_one(video.model_dump())
        for k, n in enumerate(u_data.get('notes', [])):
            note = CourseNote(unit_id=unit.id, title=n['title'], content=n['content'], order=k+1)
            await db.course_notes.insert_one(note.model_dump())

    # ========== PROGRAM 2: MCA ==========
    mca = Program(
        title="Master of Computer Applications (MCA)",
        description="An advanced postgraduate program focusing on software engineering, cloud computing, and enterprise systems.",
        image_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop",
        duration="2 Years",
        students_count=876,
        rating=4.8
    )
    await db.programs.insert_one(mca.model_dump())

    mca_subjects = [
        {"title": "Cloud Computing", "desc": "AWS, Azure, and cloud-native architecture patterns.", "icon": "Cloud"},
        {"title": "Software Engineering", "desc": "SDLC, Agile, CI/CD, and software design patterns.", "icon": "Gear"},
        {"title": "Cybersecurity", "desc": "Network security, ethical hacking, and cryptography.", "icon": "ShieldCheck"},
        {"title": "DevOps & Automation", "desc": "Docker, Kubernetes, Jenkins, and infrastructure as code.", "icon": "Terminal"}
    ]

    created_mca_subjects = []
    for s in mca_subjects:
        subj = Subject(program_id=mca.id, title=s['title'], description=s['desc'], icon=s['icon'])
        await db.subjects.insert_one(subj.model_dump())
        created_mca_subjects.append(subj)

    # MCA subject units (abbreviated - 2 units each)
    mca_subject_units = {
        0: [  # Cloud Computing
            {"title": "Cloud Fundamentals & AWS", "videos": [
                {"title": "Introduction to Cloud Computing", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "42:00", "instructor": "Prof. Alex Rivera"},
                {"title": "AWS EC2, S3 & Lambda", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "55:00", "instructor": "Prof. Alex Rivera"},
            ]},
            {"title": "Containerization & Microservices", "videos": [
                {"title": "Docker Fundamentals", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "48:00", "instructor": "Prof. Alex Rivera"},
                {"title": "Kubernetes Orchestration", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "52:00", "instructor": "Prof. Alex Rivera"},
            ]},
        ],
        1: [  # Software Engineering
            {"title": "Software Development Lifecycle", "videos": [
                {"title": "Agile vs Waterfall", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "40:00", "instructor": "Dr. Lisa Park"},
                {"title": "Scrum Framework Deep Dive", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "45:00", "instructor": "Dr. Lisa Park"},
            ]},
            {"title": "Design Patterns & Architecture", "videos": [
                {"title": "SOLID Principles", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "50:00", "instructor": "Dr. Lisa Park"},
                {"title": "MVC, MVVM & Clean Architecture", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "55:00", "instructor": "Dr. Lisa Park"},
            ]},
        ],
        2: [  # Cybersecurity
            {"title": "Network Security Fundamentals", "videos": [
                {"title": "CIA Triad & Security Models", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "38:00", "instructor": "Prof. James Cook"},
                {"title": "Firewalls, IDS & VPNs", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "44:00", "instructor": "Prof. James Cook"},
            ]},
            {"title": "Ethical Hacking & Penetration Testing", "videos": [
                {"title": "Reconnaissance & Scanning", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "50:00", "instructor": "Prof. James Cook"},
                {"title": "Exploitation & Reporting", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "52:00", "instructor": "Prof. James Cook"},
            ]},
        ],
        3: [  # DevOps
            {"title": "CI/CD Pipelines", "videos": [
                {"title": "Jenkins & GitHub Actions", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "45:00", "instructor": "Prof. Alex Rivera"},
                {"title": "Automated Testing & Deployment", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "48:00", "instructor": "Prof. Alex Rivera"},
            ]},
            {"title": "Infrastructure as Code", "videos": [
                {"title": "Terraform Basics", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "42:00", "instructor": "Prof. Alex Rivera"},
                {"title": "Ansible & Configuration Management", "url": "https://www.youtube.com/watch?v=dH0yz-Osy54", "duration": "46:00", "instructor": "Prof. Alex Rivera"},
            ]},
        ]
    }

    for subj_idx, units_list in mca_subject_units.items():
        for i, u_data in enumerate(units_list):
            unit = Unit(subject_id=created_mca_subjects[subj_idx].id, title=u_data['title'], order=i+1)
            await db.units.insert_one(unit.model_dump())
            for j, v in enumerate(u_data['videos']):
                video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
                await db.videos.insert_one(video.model_dump())

    # ========== PROGRAM 3: Data Science ==========
    ds = Program(
        title="Data Science & Analytics",
        description="A comprehensive program covering statistics, Python programming, machine learning, and big data analytics for aspiring data scientists.",
        image_url="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        duration="1 Year",
        students_count=2103,
        rating=4.9
    )
    await db.programs.insert_one(ds.model_dump())

    ds_subjects = [
        {"title": "Python for Data Science", "desc": "NumPy, Pandas, Matplotlib and data manipulation.", "icon": "Code"},
        {"title": "Statistics & Probability", "desc": "Descriptive & inferential statistics, hypothesis testing.", "icon": "ChartBar"},
        {"title": "Big Data Technologies", "desc": "Hadoop, Spark, and distributed computing.", "icon": "HardDrive"},
    ]

    created_ds_subjects = []
    for s in ds_subjects:
        subj = Subject(program_id=ds.id, title=s['title'], description=s['desc'], icon=s['icon'])
        await db.subjects.insert_one(subj.model_dump())
        created_ds_subjects.append(subj)

    ds_subject_units = {
        0: [  # Python for DS
            {"title": "Python Basics & NumPy", "videos": [
                {"title": "Python Data Types & Control Flow", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "45:00", "instructor": "Dr. Priya Sharma"},
                {"title": "NumPy Arrays & Operations", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "50:00", "instructor": "Dr. Priya Sharma"},
            ]},
            {"title": "Pandas & Data Visualization", "videos": [
                {"title": "DataFrames & Data Cleaning", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "52:00", "instructor": "Dr. Priya Sharma"},
                {"title": "Matplotlib & Seaborn Visualizations", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "48:00", "instructor": "Dr. Priya Sharma"},
            ]},
        ],
        1: [  # Statistics
            {"title": "Descriptive Statistics", "videos": [
                {"title": "Mean, Median, Mode & Distributions", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "40:00", "instructor": "Prof. Robert Kim"},
                {"title": "Variance, Std Dev & Correlation", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "42:00", "instructor": "Prof. Robert Kim"},
            ]},
            {"title": "Inferential Statistics", "videos": [
                {"title": "Hypothesis Testing & P-Values", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "50:00", "instructor": "Prof. Robert Kim"},
                {"title": "Confidence Intervals & Regression", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "48:00", "instructor": "Prof. Robert Kim"},
            ]},
        ],
        2: [  # Big Data
            {"title": "Hadoop Ecosystem", "videos": [
                {"title": "HDFS & MapReduce", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "55:00", "instructor": "Dr. Emily Watson"},
                {"title": "Hive & Pig", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "48:00", "instructor": "Dr. Emily Watson"},
            ]},
            {"title": "Apache Spark", "videos": [
                {"title": "Spark Core & RDDs", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "52:00", "instructor": "Dr. Emily Watson"},
                {"title": "Spark SQL & MLlib", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "50:00", "instructor": "Dr. Emily Watson"},
            ]},
        ]
    }

    for subj_idx, units_list in ds_subject_units.items():
        for i, u_data in enumerate(units_list):
            unit = Unit(subject_id=created_ds_subjects[subj_idx].id, title=u_data['title'], order=i+1)
            await db.units.insert_one(unit.model_dump())
            for j, v in enumerate(u_data['videos']):
                video = Video(unit_id=unit.id, title=v['title'], url=v['url'], duration=v['duration'], instructor=v['instructor'], order=j+1)
                await db.videos.insert_one(video.model_dump())

    return {"message": "Database seeded successfully with all programs, subjects, units, and videos!"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
