import json

log_path = r"C:\Users\Acer\.gemini\antigravity-ide\brain\02b6fdfa-ab4b-4931-9859-6f33ff62526d\.system_generated\logs\transcript.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        step = data.get('step_index')
        if step is not None and 110 <= step <= 115:
            print(f"--- STEP {step} ---")
            print(json.dumps(data, indent=2))
