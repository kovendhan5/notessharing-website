from flask import Flask, request, jsonify
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaFileUpload
from dotenv import load_dotenv
import os
import logging
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from cachetools import cached, TTLCache
from googleapiclient.errors import HttpError

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)

# Load environment variables from .env file
load_dotenv()

# Google Drive API setup
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = os.getenv('SERVICE_ACCOUNT_FILE')
FOLDER_ID = os.getenv('FOLDER_ID')

# Error handling for missing environment variables
if not SERVICE_ACCOUNT_FILE or not FOLDER_ID:
    raise ValueError("Missing SERVICE_ACCOUNT_FILE or FOLDER_ID environment variable")

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=creds)

# Setup logging
logging.basicConfig(level=logging.INFO)

# Setup rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

# Setup caching
cache = TTLCache(maxsize=100, ttl=300)

def cache_get(key):
    try:
        return cache[key]
    except KeyError:
        logging.info(f"Cache miss for key: {key}")
        return None
    except Exception as e:
        logging.error(f"Cache error: {e}")
        return None

def cache_set(key, value):
    try:
        cache[key] = value
        logging.info(f"Cache set for key: {key}")
    except Exception as e:
        logging.error(f"Cache error: {e}")

@app.route('/upload', methods=['POST'])
@limiter.limit("10 per minute")
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        # Validate file size and MIME type
        if file.mimetype not in ['application/pdf', 'image/jpeg', 'image/png']:
            return jsonify({"error": "Invalid file type"}), 400
        if file:
            file_path = os.path.join('/tmp', file.filename)
            file.save(file_path)
            file_metadata = {
                'name': file.filename,
                'parents': [FOLDER_ID]
            }
            media = MediaFileUpload(file_path, resumable=True)
            drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            os.remove(file_path)
            return jsonify({"message": "File uploaded successfully"}), 200
    except IOError as e:
        logging.error(f"File error: {e}")
        return jsonify({"error": "An error occurred while handling the file"}), 500
    except HttpError as e:
        logging.error(f"Google Drive API error: {e}")
        return jsonify({"error": "An error occurred with the Google Drive API"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/files', methods=['GET'])
@limiter.limit("10 per minute")
def list_files():
    try:
        files = []
        filter_query = request.args.get('filter', '')
        sort_order = request.args.get('sort', 'name')
        # Validate sort_order
        if sort_order not in ['name', 'createdTime', 'modifiedTime']:
            return jsonify({"error": "Invalid sort parameter"}), 400
        # Validate filter_query
        if not isinstance(filter_query, str):
            return jsonify({"error": "Invalid filter parameter"}), 400
        cache_key = f"{filter_query}_{sort_order}"
        cached_files = cache_get(cache_key)
        if cached_files:
            return jsonify(cached_files), 200
        for results in iter(lambda: drive_service.files().list(
                q=f"'{FOLDER_ID}' in parents and name contains '{filter_query}'",
                orderBy=sort_order,
                pageSize=10, fields="nextPageToken, files(id, name)",
                pageToken=None if not files else files[-1].get('nextPageToken')).execute(),
                lambda results: results.get('nextPageToken')):
            files.extend(results.get('files', []))
        cache_set(cache_key, files)
        return jsonify(files), 200
    except HttpError as e:
        logging.error(f"Google Drive API error: {e}")
        return jsonify({"error": "An error occurred with the Google Drive API"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True)
