import sqlite3

conn = sqlite3.connect("india_tour_planner.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row['name'] for row in cursor.fetchall()]
print("Tables in database:", tables)
conn.close()
