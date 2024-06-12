const express = require('express');
const multer = require('multer');
const fs = require('fs'); // Add this line to use the fs module
const app = express();

const upload = multer({ dest: './uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
  // req.file contains the uploaded file
  // req.body contains the entire request body
  console.log(req.file);
  console.log(req.body);

  // You can store the file in a database or file system here
  // For this example, we'll just save it to a folder
  const filePath = `./uploads/${req.file.originalname}`;
  fs.writeFileSync(filePath, req.file.buffer);

  res.send(`File uploaded successfully!`);
});

app.put('/edit/:title', (req, res) => {
  // Handle edit file logic here
  const title = req.params.title;
  const filePath = `./uploads/${title}`;
  if (fs.existsSync(filePath)) {
    // Update the file contents or metadata here
    fs.writeFileSync(filePath, 'New file contents'); // Replace with actual update logic
    res.send(`File edited successfully!`);
  } else {
    res.status(404).send(`File not found!`);
  }
});

app.delete('/delete/:title', (req, res) => {
  // Handle delete file logic here
  const title = req.params.title;
  const filePath = `./uploads/${title}`;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.send(`File deleted successfully!`);
  } else {
    res.status(404).send(`File not found!`);
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});