
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
print(f"Checking env file at: {env_path}")
print(f"File exists: {env_path.exists()}")

if env_path.exists():
    print(f"File content preview:")
    with open(env_path, 'r') as f:
        print(f.read()[:50] + "...")

load_dotenv(env_path)

cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
api_key = os.environ.get('CLOUDINARY_API_KEY')
api_secret = os.environ.get('CLOUDINARY_API_SECRET')

print(f"\nLoaded Values:")
print(f"CLOUD_NAME: {cloud_name}")
print(f"API_KEY: {api_key}")
print(f"API_SECRET: {'*' * 5 if api_secret else 'None'}")
