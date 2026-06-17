import subprocess
import os

frontend_dir = r"c:\Users\Acer\OneDrive\Desktop\India Tour\frontend"
os.chdir(frontend_dir)
print("Current directory:", os.getcwd())

try:
    result = subprocess.run("npm run build", shell=True, capture_output=True, text=True)
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    print("Exit code:", result.returncode)
except Exception as e:
    print("Error running build:", str(e))
