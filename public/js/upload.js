const dragDropArea = document.getElementById('dragDropArea');
const fileInput = document.getElementById('fileInput');
const previewTableBody = document.getElementById('previewTableBody');
const submitAllButton = document.getElementById('submitAllButton');
let files = [];

dragDropArea.addEventListener('click', () => {
  fileInput.click();
});

function handleDragOver(event) {
  event.preventDefault();
  dragDropArea.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  dragDropArea.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  dragDropArea.classList.remove('drag-over');
  handleFiles(event.dataTransfer.files);
}

function handleFiles(selectedFiles) {
  for (const file of selectedFiles) {
    if (file.type.startsWith('image/')) {
      const id = `file-${files.length}`;
      const fileObj = { id, file, description: null, visibility: 'public', status: 'Pending' };
      files.push(fileObj);

      const reader = new FileReader();
      reader.onload = (e) => {
        const row = document.createElement('tr');
        row.id = id;

        row.innerHTML = `
          <td><img src="${e.target.result}" alt="Image"></td>
          <td>
            <span class="display-description" id="display-section-${id}">
              <span id="description-${id}">File ${files.length+1}</span>
              <button class="btn btn-sm btn-secondary" id="edit-description-${id}" onclick="editDescription('${id}')">Edit Description</button>
            </span>
            <span class="edit-description" style="display: none" id="edit-section-${id}">
              <textarea class="form-control mt-2" id="description-edit-${id}" style="max-width: 80%" rows="1">File ${files.length+1}</textarea>
              <button class="btn btn-sm btn-primary mt-2" onclick="saveDescription('${id}')">Save</button>
            </span>

            <button id="clear-${id}" class="btn btn-sm btn-danger ms-2" onclick="clearDescription('${id}')">
              Clear
            </button>
          </td>
          <td>
            <select class="form-select" id="visibility-${id}" onchange="updateVisibility('${id}', this.value)">
              <option value="public" selected>Public</option>
              <option value="private">Private</option>
            </select>
          </td>
          <td>
            <div class="loading-bar" id="loading-${id}">
              <span></span>
            </div>
            <span id="status-${id}">Pending</span>
          </td>
        `;

        previewTableBody.appendChild(row);
      };

      reader.readAsDataURL(file);
    }
  }
}

function editDescription(id) {
  const displaySection = document.getElementById(`display-section-${id}`);
  const editSection = document.getElementById(`edit-section-${id}`);
  displaySection.style.display = 'none';
  editSection.style.display = 'inline';
}

function saveDescription(id) {
  const editSection = document.getElementById(`edit-section-${id}`);
  const displaySection = document.getElementById(`display-section-${id}`);
  const descriptionEdit = document.getElementById(`description-edit-${id}`);
  const description = descriptionEdit.value;
  displaySection.style.display = 'flex';
  editSection.style.display = 'none';
  displaySection.querySelector(`#description-${id}`).textContent = description;
  
  const fileObj = files.find((f) => f.id === id);
  if (fileObj) {
    fileObj.description = description;
  }
}

function clearDescription(id) {
  const fileObj = files.find((f) => f.id === id);
  if (fileObj) {
    fileObj.description = null;
  }

  const row = document.getElementById(id);
  const cell = row.children[1];
  cell.querySelector(`#description-${id}`).textContent = "-";
  cell.querySelector(`#description-edit-${id}`).textContent = "-";
  
  // cell.innerHTML = `
  //   <span class="text-muted">No Description</span>
  //   <button class="btn btn-sm btn-secondary ms-2" onclick="editDescription('${id}')">
  //     <i class="bi bi-pencil"></i>
  //   </button>
  //   <button class="btn btn-sm btn-danger ms-2" onclick="clearDescription('${id}')">
  //     Clear
  //   </button>
  // `;
}
function updateVisibility(id, value) {
  const fileObj = files.find((f) => f.id === id);
  if (fileObj) {
    fileObj.visibility = value;
  }
}

async function submitFiles(id) {
  const fileObj = files.find((f) => f.id === id);
  if (!fileObj) return;

  const formData = new FormData();
  formData.append('file', fileObj.file);
  if (fileObj.description != null) formData.append('description', fileObj.description);
  formData.append('visibility', fileObj.visibility);

  const loadingBar = document.getElementById(`loading-${id}`);
  const statusSpan = document.getElementById(`status-${id}`);
  loadingBar.style.display = 'block';
  statusSpan.textContent = 'Uploading...';

  try {
    const response = await fetch('/app.php?command=upload_image', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      loadingBar.style.display = 'none';
    } else {
      alert(`Failed to upload ${fileObj.file.name}`);
    }
  } catch (error) {
    alert(`Error uploading ${fileObj.file.name}: ${error.message}`);
  }
  
  loadingBar.style.display = 'none';
  statusSpan.textContent = 'Finished';
  fileObj.status = 'Finished';

  checkAllFinished();
}

async function submitAll() {
  for (const file of files) {
    if (file.status !== 'Finished') {
      await submitFiles(file.id);
    }
  }
}

function checkAllFinished() {
  if (files.every((file) => file.status === 'Finished')) {
    submitAllButton.textContent = 'Next';
    submitAllButton.onclick = () => alert('Proceed to the next step!');
  }
}