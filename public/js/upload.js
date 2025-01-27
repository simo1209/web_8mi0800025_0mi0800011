const dragDropArea = document.getElementById('dragDropArea');
const fileInput = document.getElementById('fileInput');
const previewTableBody = document.getElementById('previewTableBody');
const submitAllButton = document.getElementById('submitAllButton');
const albumSelection = document.getElementById('albumSelection'); // Album dropdown
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
      const fileObj = { id, file, index: files.length, description: null, visibility: 'public', status: 'Pending', geo_data: null };
      files.push(fileObj);

      const reader = new FileReader();
      reader.onload = (e) => {
        const row = document.createElement('tr');
        row.id = id;

        row.innerHTML = `
          <td><img src="${e.target.result}" alt="Image"></td>
          <td>
            <span class="display-description" id="display-section-${id}">
              <span id="description-${id}">File ${fileObj.index + 1}</span>
              <button class="btn btn-sm btn-secondary" id="edit-description-${id}" onclick="editDescription('${id}')">Edit Description</button>
            </span>
            <span class="edit-description" style="display: none" id="edit-section-${id}">
              <textarea class="form-control mt-2" id="description-edit-${id}" style="max-width: 80%" rows="1">File ${files.length + 1}</textarea>
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
            <input type="text" class="form-control geo-input" id="geo-${id}" placeholder="Enter coordinates (e.g., 42.6977, 23.3219)">
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
}

function updateVisibility(id, value) {
  const fileObj = files.find((f) => f.id === id);
  if (fileObj) {
    fileObj.visibility = value;
  }
}

function updateGeolocation(id, value) {
  const fileObj = files.find((f) => f.id === id);
  if (fileObj) {
    fileObj.geo_data = value;
  }
}

async function createAlbum() {
  const name = document.getElementById('albumName').value;
  const description = document.getElementById('albumDescription').value;

  if (!name || !description) {
    alert('Please fill in all fields.');
    return;
  }

  // Prepare data for API call
  const payload = {
    name: name,
    description: description,
    owner_id: 1 // Replace with the actual owner ID
  };

  try {
    // Make API call to create the album
    const response = await fetch('/app.php?command=/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create album.');
    }

    const data = await response.json();
    const newAlbumId = data.album_id || Date.now(); // Use ID from API if available

    // Add new album to the dropdown
    const option = document.createElement('option');
    option.value = newAlbumId;
    option.textContent = name;
    option.selected = true;
    albumSelection.appendChild(option);

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAlbumModal'));
    modal.hide();

    // Clear modal inputs
    document.getElementById('albumName').value = '';
    document.getElementById('albumDescription').value = '';

    alert('Album created successfully!');
  } catch (error) {
    console.error(error);
    alert(`Error creating album: ${error.message}`);
  }
}

async function fetchAlbums() {
  try {
    // Make API call to fetch albums
    const response = await fetch('/app.php?command=/albums', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch albums.');
    }

    const albums = await response.json();

    // Populate the album dropdown
    albumSelection.innerHTML = ''; // Clear existing options
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an album';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    albumSelection.appendChild(defaultOption);

    albums.forEach((album) => {
      const option = document.createElement('option');
      option.value = album.id;
      option.textContent = album.name;
      albumSelection.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    alert(`Error fetching albums: ${error.message}`);
  }
}

async function submitFiles(id) {
  const fileObj = files.find((f) => f.id === id);
  if (!fileObj) return;

  const geoInput = document.getElementById(`geo-${id}`);
  if (geoInput) {
    fileObj.geo_data = geoInput.value;
  }

  const albumId = albumSelection.value; // Get the selected album ID
  if (!albumId) {
    alert('Please select or create an album first.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileObj.file);
  if (fileObj.description != null) formData.append('description', fileObj.description);
  formData.append('visibility', fileObj.visibility);
  if (fileObj.geo_data != null) formData.append('geo_data', fileObj.geo_data);
  formData.append('album_id', albumId); // Include album_id in the payload

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

// Fetch albums on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchAlbums();
});
