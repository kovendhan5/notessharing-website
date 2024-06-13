
from flask import Flask, request, jsonify
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaFileUpload
import os

app = Flask(__name__)

# Google Drive API setup
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = 'client_secret.json'

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=creds)

# Folder ID where files will be uploaded
FOLDER_ID = 'your_google_drive_folder_id'

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        file_metadata = {
            'name': file.filename,
            'parents': [FOLDER_ID]
        }
        media = MediaFileUpload(file, resumable=True)
        drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        return jsonify({"message": "File uploaded successfully"}), 200

@app.route('/files', methods=['GET'])
def list_files():
    results = drive_service.files().list(
        q=f"'{FOLDER_ID}' in parents",
        pageSize=10, fields="nextPageToken, files(id, name)").execute()
    items = results.get('files', [])
    return jsonify(items), 200

if __name__ == '__main__':
    app.run(debug=True)
