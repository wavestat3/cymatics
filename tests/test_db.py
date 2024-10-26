from backend.database.database import init_db, get_db

def test_database():
    try:
        init_db()
        db = next(get_db())
        result = db.execute("SELECT 1").fetchone()
        print("Database connection successful!")
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    test_database()