const { google } = require('googleapis');

const CLIENT_ID = '130258146268-8omlsvs6g2nmljr49gqes96mfjiif2jk.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://kovendhan5.github.io/need-for-code/';

const auth = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const drive = google.drive('v3');

let accessToken = null;

export function handleClientLoad() {
  auth.authorize((err, tokens) => {
    if (err) {
      console.error(err);
      return;
    }
    accessToken = tokens.access_token;
    console.log('Authenticated!');
    listFiles();
  });
}

export function uploadFile(event) {
  const file = event.target.files[0];
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({
    'name': file.name,
    'imeType': file.type
  })], { type: 'application/json' }));
  form.append('file', file);

  auth.getAccessToken((err, token) => {
    if (err) {
      console.error(err);
      return;
    }
    accessToken = token;
    drive.files.create({
      requestBody: {
        'name': file.name,
        'imeType': file.type
      },
      media: {
        mimeType: file.type,
        body: file
      }
    }, (err, file) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`File uploaded: ${file.id}`);
      listFiles();
    });
  });
}

export function listFiles() {
  auth.getAccessToken((err, token) => {
    if (err) {
      console.error(err);
      return;
    }
    accessToken = token;
    drive.files.list({
      'pageSize': 10,
      'fields': "nextPageToken, files(id, name)"
    }, (err, response) => {
      if (err) {
        console.error(err);
        return;
      }
      const files = response.data.files;
      if (files && files.length > 0) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        files.forEach((file) => {
          const li = document.createElement('li');
          li.textContent = file.name;
          fileList.appendChild(li);
        });
      }
    });
  });
}

export function deleteFile(fileId) {
  auth.getAccessToken((err, token) => {
    if (err) {
      console.error(err);
      return;
    }
    accessToken = token;
    drive.files.delete({
      'fileId': fileId
    }, (err, response) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`File deleted: ${fileId}`);
      listFiles();
    });
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  handleClientLoad();
});

document.getElementById('fileInput').addEventListener('change', uploadFile);

document.getElementById('refreshButton').addEventListener('click', listFiles);