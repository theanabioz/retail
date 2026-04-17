from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.seed import seed_database


def main() -> None:
    if engine is None:
        raise RuntimeError("SUPABASE_DB_URL is not configured.")

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        seed_database(session)


if __name__ == "__main__":
    main()
