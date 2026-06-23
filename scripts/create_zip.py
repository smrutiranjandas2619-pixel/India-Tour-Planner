import os
import zipfile

def create_zip():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_name = os.path.join(project_dir, "India_Tour_Planner.zip")
    
    # Folders to exclude
    exclude_folders = {
        '.git',
        'node_modules',
        '__pycache__',
        '.venv',
        'dist',
        '.pytest_cache',
        '.idea',
        '.vscode'
    }
    
    # Files to exclude (like existing zips)
    exclude_files = {
        'India_Tour_Planner.zip'
    }
    
    print(f"Creating zip at: {zip_name}")
    print(f"Source directory: {project_dir}")
    print(f"Excluding folders: {', '.join(exclude_folders)}")
    
    count = 0
    total_size = 0
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_dir):
            # Modify dirs in-place to exclude specified directories from walkthrough
            dirs[:] = [d for d in dirs if d not in exclude_folders]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip') or file.endswith('.rar'):
                    continue
                
                full_path = os.path.join(root, file)
                # Get path relative to the project root directory
                rel_path = os.path.relpath(full_path, project_dir)
                
                zipf.write(full_path, rel_path)
                file_size = os.path.getsize(full_path)
                total_size += file_size
                count += 1
                
    print(f"\nSuccessfully compressed {count} files.")
    print(f"Original size of compressed files: {total_size / (1024*1024):.2f} MB")
    print(f"Zip file size: {os.path.getsize(zip_name) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    create_zip()
