console.log("App.js loaded!");

const fileInput = document.getElementById("file-input");
const uploadButton = document.getElementById("upload-button");
const fileListDiv = document.getElementById("file-list");

uploadButton.addEventListener("click", (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const fileContent = reader.result;
    const fileName = file.name;
    const fileSize = file.size;

    const fileListItem = document.createElement("div");
    fileListItem.textContent = `File: ${fileName} (${fileSize} bytes)`;
    fileListDiv.appendChild(fileListItem);

    console.log(`File uploaded: ${fileName} (${fileSize} bytes)`);
  };

  reader.readAsText(file);
});