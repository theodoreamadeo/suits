from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from pydantic import BaseModel

from backend.models.database import User, UserPreferences, Gender, Occasion, engine
from backend.models.auth import (
    Token, UserCreate, UserPreferencesCreate, TokenData,
    verify_password, get_password_hash, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
)
from backend.models.google_auth import verify_google_token
from sqlalchemy.orm import sessionmaker
from jose import JWTError, jwt

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/preferences")
async def create_user_preferences(
    preferences: UserPreferencesCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_preferences = UserPreferences(
        user_id=current_user.id,
        gender=Gender(preferences.gender),
        occasion=Occasion(preferences.occasion),
        footwear=preferences.footwear if preferences.footwear else None
    )
    db.add(db_preferences)
    db.commit()
    db.refresh(db_preferences)
    return {"message": "Preferences created successfully"}

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google-auth", response_model=Token)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify Google token and get user info
        user_info = await verify_google_token(request.token)
        
        # Check if user exists
        user = db.query(User).filter(User.email == user_info['email']).first()
        
        if not user:
            # Create new user
            user = User(
                email=user_info['email'],
                google_id=user_info['google_id'],
                is_google_user=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.is_google_user:
            # Update existing user to use Google auth
            user.google_id = user_info['google_id']
            user.is_google_user = True
            db.commit()
            db.refresh(user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) 
    
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "skin_tone": current_user.skin_tone,
        # Add other fields as needed
    }

@router.get("/preferences")
async def get_user_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).order_by(UserPreferences.id.desc()).all()
    return [
        {
            "gender": pref.gender.value if pref.gender else None,
            "occasion": pref.occasion.value if pref.occasion else None,
            "footwear": pref.footwear.value if pref.footwear else None,
            "weight": getattr(pref, "weight", None),
            "height": getattr(pref, "height", None),
            "skin_tone": getattr(pref, "skin_tone", None),
            # Add more fields as needed
        }
        for pref in preferences
    ]

class SkinToneRequest(BaseModel):
    skin_tone: str

@router.post("/skin-tone")
async def save_skin_tone(
    req: SkinToneRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.skin_tone = req.skin_tone
    db.commit()
    db.refresh(current_user)
    return {"message": "Skin tone saved"}