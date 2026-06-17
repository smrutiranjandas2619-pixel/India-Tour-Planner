import os
import shutil
import subprocess

frontend_dir = r"c:\Users\Acer\OneDrive\Desktop\India Tour\frontend"
dist_dir = os.path.join(frontend_dir, "dist")

if os.path.exists(dist_dir):
    print("Deleting existing dist folder...")
    shutil.rmtree(dist_dir)
    print("Deleted.")

os.chdir(frontend_dir)
try:
    print("Running npm run build...")
    result = subprocess.run("npm run build", shell=True, capture_output=True, text=True)
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    print("Exit code:", result.returncode)
    
    # Check if files in dist exist and search for the string
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        for f in os.listdir(assets_dir):
            if f.endswith(".js"):
                filepath = os.path.join(assets_dir, f)
                print("Checking compiled file:", filepath)
                with open(filepath, "r", encoding="utf-8") as js_file:
                    content = js_file.read()
                    if "Log in to consult" in content:
                        print("WARNING: 'Log in to consult' still present in", f)
                    else:
                        print("SUCCESS: 'Log in to consult' not found in", f)
                    
                    if "Forgot Password?" in content:
                        print("INFO: 'Forgot Password?' found in", f)
except Exception as e:
    print("Error during process:", str(e))
