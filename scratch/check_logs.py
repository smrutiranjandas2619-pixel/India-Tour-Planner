import os
import json

log_path = r"C:\Users\Acer\.gemini\antigravity-ide\brain\02b6fdfa-ab4b-4931-9859-6f33ff62526d\.system_generated\logs\transcript.jsonl"
if os.path.exists(log_path):
    print("File exists, size:", os.path.getsize(log_path))
    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        print("Total lines:", len(lines))
        for line in lines[-15:]:
            try:
                data = json.loads(line)
                print(f"[{data.get('type') or data.get('source')}] {str(data)[:200]}...")
            except Exception as e:
                print("Error parsing line:", str(e))
else:
    print("File does not exist")
