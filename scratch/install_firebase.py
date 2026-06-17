import os
import subprocess

frontend_dir = r"c:\Users\Acer\OneDrive\Desktop\India Tour\frontend"
os.chdir(frontend_dir)

print("Running npm install firebase --save inside:", frontend_dir)
try:
    result = subprocess.run("npm install firebase --save", shell=True, capture_output=True, text=True)
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    print("Exit code:", result.returncode)
except Exception as e:
    print("Error:", str(e))
