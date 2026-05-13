import os
import sys
import django
sys.path.append(os.getcwd())
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

def test_upload():
    try:
        content = b"test content"
        file_name = "test_connection.txt"
        path = default_storage.save(file_name, ContentFile(content))
        print(f"File saved to: {path}")
        url = default_storage.url(path)
        print(f"File URL: {url}")
        
        # Clean up
        # default_storage.delete(path)
        # print("File deleted.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_upload()
