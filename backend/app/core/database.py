import os
import sqlite3

# Resolve the absolute path to the SQLite database in the root folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DB_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../../india_tour_planner.db"))

# Fetch Turso cloud database configuration if available
TURSO_URL = os.environ.get("TURSO_DATABASE_URL") or os.environ.get("VITE_TURSO_DATABASE_URL")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN") or os.environ.get("VITE_TURSO_AUTH_TOKEN")

# Custom row-mapping wrapper for Turso libSQL client to behave exactly like sqlite3.Row
class LibSQLRow(tuple):
    def __new__(cls, values, keys):
        obj = super().__new__(cls, values)
        obj._keys = keys
        obj._mapping = {k: i for i, k in enumerate(keys)}
        return obj

    def __getitem__(self, item):
        if isinstance(item, str):
            idx = self._mapping.get(item)
            if idx is None:
                raise KeyError(item)
            return super().__getitem__(idx)
        return super().__getitem__(item)

    def keys(self):
        return self._keys

class LibSQLCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, *args, **kwargs):
        self.cursor.execute(*args, **kwargs)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        keys = [desc[0] for desc in self.cursor.description]
        return LibSQLRow(row, keys)

    def fetchall(self):
        rows = self.cursor.fetchall()
        keys = [desc[0] for desc in self.cursor.description]
        return [LibSQLRow(row, keys) for row in rows]

    def __getattr__(self, name):
        return getattr(self.cursor, name)

class LibSQLConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return LibSQLCursorWrapper(self.conn.cursor())

    def __getattr__(self, name):
        return getattr(self.conn, name)

def get_db_connection():
    """Returns a thread-safe connection to the SQLite database (local or Turso Cloud)."""
    if TURSO_URL:
        import libsql
        conn = libsql.connect(TURSO_URL, auth_token=TURSO_TOKEN)
        return LibSQLConnectionWrapper(conn)
    else:
        conn = sqlite3.connect(LOCAL_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    """Initializes tables if they do not exist (ensuring data continuity)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Create Saved Trips Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            start_location TEXT NOT NULL,
            destination TEXT NOT NULL,
            days INTEGER NOT NULL,
            travelers INTEGER NOT NULL,
            budget_category TEXT NOT NULL,
            total_cost INTEGER NOT NULL,
            cost_breakdown TEXT NOT NULL, -- JSON string
            ai_response TEXT NOT NULL,      -- Markdown response
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    # Ensure avatar column exists in users table
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar TEXT")
    except Exception:
        pass # Column already exists
        
    # 3. Create Cached Hotels Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cached_hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price_range TEXT,
            price_val INTEGER,
            rating REAL,
            address TEXT,
            photo TEXT,
            map_link TEXT,
            latitude REAL,
            longitude REAL,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 4. Create Cached Restaurants Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cached_restaurants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            name TEXT NOT NULL,
            cuisine TEXT,
            price_range TEXT,
            rating REAL,
            address TEXT,
            photo TEXT,
            map_link TEXT,
            latitude REAL,
            longitude REAL,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if migration is needed to support Phone Auth (making email/password nullable and adding new columns)
    cursor.execute("PRAGMA table_info(users)")
    columns = [col['name'] for col in cursor.fetchall()]
    
    if "phone_number" not in columns:
        print("Migrating users table structure to support phone number authentication...")
        # 1. Rename existing users table
        cursor.execute("ALTER TABLE users RENAME TO users_old_backup")
        
        # 2. Create the new users table with nullable email & password and new columns
        cursor.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                password TEXT,
                phone_number TEXT UNIQUE,
                auth_provider TEXT DEFAULT 'email',
                is_phone_verified BOOLEAN DEFAULT 0,
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 3. Copy existing users from backup
        cursor.execute("PRAGMA table_info(users_old_backup)")
        old_cols = [col['name'] for col in cursor.fetchall()]
        
        insert_cols = ["id", "name", "email", "password", "created_at"]
        if "avatar" in old_cols:
            insert_cols.append("avatar")
            
        cols_str = ", ".join(insert_cols)
        cursor.execute(f"""
            INSERT INTO users ({cols_str}, auth_provider)
            SELECT {cols_str}, 'email' FROM users_old_backup
        """)
        
        # 4. Drop the backup table
        cursor.execute("DROP TABLE users_old_backup")
        print("Database migration for phone authentication completed successfully.")
    
    conn.commit()
    conn.close()
