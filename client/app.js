require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

// Use googleClientId and googleApiKey in your application

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  }, function(error) {
    console.log(JSON.stringify(error, null, 2));
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    // User is signed in, now you can make API calls.
  } else {
    // User is not signed in, start the sign-in process.
    gapi.auth2.getAuthInstance().signIn();
  }
}

function uploadFile(event) {
  const file = event.target.files[0];
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({
    'name': file.name,
    'mimeType': file.type
  })], { type: 'application/json' }));
  form.append('file', file);

  // Validate file size and MIME type
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    alert('File size exceeds 10MB limit');
    return;
  }

  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
    alert('Invalid file type');
    return;
  }

  gapi.client.request({
    'path': '/upload/drive/v3/files',
    'method': 'POST',
    'params': { 'uploadType': 'multipart' },
    'headers': {
      'Content-Type': 'multipart/related'
    },
    'body': form
  }).then(function(response) {
    console.log(response);
    // Call function to display the file.
  }).catch(function(error) {
    console.error('Error uploading file:', error);
  });
}

function listFiles() {
  gapi.client.drive.files.list({
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name, mimeType)"
  }).then(function(response) {
    const files = response.result.files;
    console.log(files);
    // Call function to display the file list.
  }).catch(function(error) {
    console.error('Error listing files:', error);
  });
}