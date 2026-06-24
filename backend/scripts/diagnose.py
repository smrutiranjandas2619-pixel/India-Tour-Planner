import os
import sys
import traceback

# Adjust system path to point to backend directory (one level up)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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
    
    # Write diagnostic result into backend/logs/diagnose_result.txt
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(script_dir, "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, "diagnose_result.txt")
    
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("All imports and DB connections are 100% OK!\n")
    print(f"Diagnostics completed successfully. Result written to {log_path}")
        
except Exception as e:
    print(f"DIAGNOSTIC ERROR: {e}")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(script_dir, "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, "diagnose_result.txt")
    
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(f"DIAGNOSTIC ERROR: {e}\n")
        traceback.print_exc(file=f)
    print(f"Diagnostics failed. Error written to {log_path}")
