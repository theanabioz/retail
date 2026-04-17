from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings


settings = get_settings()

engine = create_engine(settings.supabase_db_url, pool_pre_ping=True) if settings.supabase_db_url else None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    if engine is None:
        raise RuntimeError("SUPABASE_DB_URL is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
