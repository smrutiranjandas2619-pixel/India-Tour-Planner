import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("app.main imported successfully!")
    
    print("Testing DB connection...")
    from app.core.database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email FROM users LIMIT 1;")
    user = cursor.fetchone()
    print("DB connection successful! Found user:", dict(user) if user else "None")
    conn.close()
    
    with open("diagnose_result.txt", "w") as f:
        f.write("All imports and DB connections are 100% OK!\n")
        
except Exception as e:
    print(f"DIAGNOSTIC ERROR: {e}")
    with open("diagnose_result.txt", "w") as f:
        f.write(f"DIAGNOSTIC ERROR: {e}\n")
        traceback.print_exc(file=f)
