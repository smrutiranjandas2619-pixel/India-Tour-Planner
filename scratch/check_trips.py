import sqlite3

conn = sqlite3.connect("india_tour_planner.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT * FROM cached_hotels LIMIT 3")
rows = cursor.fetchall()
print("CACHED HOTELS:")
for r in rows:
    print(dict(r))
    print("-" * 40)

cursor.execute("SELECT * FROM cached_restaurants LIMIT 3")
rows = cursor.fetchall()
print("CACHED RESTAURANTS:")
for r in rows:
    print(dict(r))
    print("-" * 40)
conn.close()
