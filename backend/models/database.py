from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class Occasion(str, enum.Enum):
    CASUAL = "CASUAL"
    ETHNIC = "ETHNIC"
    FORMAL = "FORMAL"
    SPORTS = "SPORTS"
    SMART_CASUAL = "SMART_CASUAL"
    PARTY = "PARTY"
    TRAVEL = "TRAVEL"

class Footwear(str, enum.Enum):
    ANY = "Any"
    CASUAL_SHOES = "Casual Shoes"
    FORMAL_SHOES = "Formal Shoes"
    SPORTS_SHOES = "Sports Shoes"
    SANDALS = "Sandals"
    HEELS = "Heels"
    FLATS = "Flats"
    FLIP_FLOPS = "Flip Flops"
    SAREE = "Saree"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for Google auth users
    google_id = Column(String, unique=True, nullable=True)  # For Google auth
    is_google_user = Column(Boolean, default=False)  # Flag for Google auth users
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    skin_tone = Column(String, nullable=True)  # Moved from UserPreferences

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    gender = Column(Enum(Gender))
    occasion = Column(Enum(Occasion))
    footwear = Column(Enum(Footwear), nullable=True)
    
    user = relationship("User", back_populates="preferences")

# Database URL will be set in environment variables
DATABASE_URL = "postgresql://postgres:postgres@localhost/suits_db"

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine) 