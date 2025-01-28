const dragDropArea = document.getElementById('dragDropArea');
const fileInput = document.getElementById('fileInput');
const previewTableBody = document.getElementById('previewTableBody');
const submitAllButton = document.getElementById('submitAllButton');
const albumSelection = document.getElementById('albumSelection'); // Album dropdown
const importZipButton = document.getElementById('importZipButton');
let files = {};

let modal = document.getElementById('modal');
let modalShown = false;

dragDropArea.addEventListener('click', () => {
  fileInput.click();
});

importZipButton.addEventListener('click', importZip);

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

function handleModalClick(id) {

  console.log(id);
  if (modalShown) {
    modal.closest()
  } else {
    modal.showModal();
  }
  modalShown = !modalShown;
}

function setEditGeoImageId(id) {
  document.querySelector('#editGeo').setAttribute('data-image-id', id);
}

function handleFiles(selectedFiles) {
  for (const file of selectedFiles) {
    if (file.type.startsWith('image/')) {
      const index = Object.keys(files).length;
      const id = `file-${index}`;
      const fileObj = { id, file, index, description: null, visibility: 'public', status: 'Pending', geo_data: {lat: 42.674435, lng: 23.330431} };
      // files.push(fileObj);
      files[id] = fileObj;

      const reader = new FileReader();
      reader.onload = (e) => {
        const row = document.createElement('tr');
        row.id = id;

        row.innerHTML = `
          <td><img src="${e.target.result}" alt="Image"></td>
          <td>
            <span class="display-description" id="display-section-${id}">
              <span id="description-${id}">File ${fileObj.index + 1}</span>
              <button class="btn btn-sm btn-secondary" id="edit-description-${id}" onclick="editDescription('${id}')">Редактирай описанието</button>
            </span>
            <span class="edit-description" style="display: none" id="edit-section-${id}">
              <textarea class="form-control mt-2" id="description-edit-${id}" style="max-width: 80%" rows="1">File ${files.length + 1}</textarea>
              <button class="btn btn-sm btn-primary mt-2" onclick="saveDescription('${id}')">Запази</button>
            </span>

            <button id="clear-${id}" class="btn btn-sm btn-danger ms-2" onclick="clearDescription('${id}')">
              Изчисти
            </button>
          </td>
          <td>
            <select class="form-select" id="visibility-${id}" onchange="updateVisibility('${id}', this.value)">
              <option value="public" selected>Публична</option>
              <option value="private">Частна</option>
            </select>
          </td>
          <td>
            <input style="display: none;" type="text" class="form-control geo-input" id="geo-${id}" placeholder="Enter coordinates (e.g., 42.6977, 23.3219)">
            <button class="btn btn-outline-secondary ms-2" data-bs-toggle="modal" data-bs-target="#editGeo" onclick="setEditGeoImageId('${id}')">Редактирай</button>
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

function handleSingleFile(file) {
  return new Promise((resolve, reject) => {
    // Skip non-images
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Not an image file: ' + file.name));
    }

    // Generate a new ID based on how many we’ve already added
    const index = Object.keys(files).length;
    const id = `file-${index}`;

    // Create the file object for your global “files” store
    const fileObj = {
      id,
      file,
      index,
      description: null,
      visibility: 'public',
      status: 'Pending',
      geo_data: { lat: 42.674435, lng: 23.330431 }
    };
    files[id] = fileObj;

    // Use FileReader to generate a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      // Build the table row
      const row = document.createElement('tr');
      row.id = id;
      row.innerHTML = `
        <td><img src="${e.target.result}" alt="Image"></td>
        <td>
          <span class="display-description" id="display-section-${id}">
            <span id="description-${id}">File ${fileObj.index + 1}</span>
            <button class="btn btn-sm btn-secondary" id="edit-description-${id}" onclick="editDescription('${id}')">Редактирай описанието</button>
          </span>
          <span class="edit-description" style="display: none" id="edit-section-${id}">
            <textarea class="form-control mt-2" id="description-edit-${id}" style="max-width: 80%" rows="1">File ${index + 1}</textarea>
            <button class="btn btn-sm btn-primary mt-2" onclick="saveDescription('${id}')">Запази</button>
          </span>

          <button id="clear-${id}" class="btn btn-sm btn-danger ms-2" onclick="clearDescription('${id}')">
            Изчисти
          </button>
        </td>
        <td>
          <select class="form-select" id="visibility-${id}" onchange="updateVisibility('${id}', this.value)">
            <option value="public" selected>Публична</option>
            <option value="private">Частна</option>
          </select>
        </td>
        <td>
          <input style="display: none;" type="text" class="form-control geo-input" id="geo-${id}" placeholder="Enter coordinates (e.g., 42.6977, 23.3219)">
          <button class="btn btn-outline-secondary ms-2" data-bs-toggle="modal" data-bs-target="#editGeo" onclick="setEditGeoImageId('${id}')">Редактирай</button>
        </td>
        <td>
          <div class="loading-bar" id="loading-${id}">
            <span></span>
          </div>
          <span id="status-${id}">Pending</span>
        </td>
      `;

      // Attach row to preview table
      previewTableBody.appendChild(row);

      // Resolve so we know this file is fully added
      resolve({ id });
    };

    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      reject(err);
    };

    // Start reading
    reader.readAsDataURL(file);
  });
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

  const fileObj = files[id];
  if (fileObj) {
    fileObj.description = description;
  }
}

function clearDescription(id) {
  const fileObj = files[id];
  if (fileObj) {
    fileObj.description = null;
  }

  const row = document.getElementById(id);
  const cell = row.children[1];
  cell.querySelector(`#description-${id}`).textContent = "-";
  cell.querySelector(`#description-edit-${id}`).textContent = "-";
}

function updateVisibility(id, value) {
  const fileObj = files[id];
  if (fileObj) {
    fileObj.visibility = value;
  }
}

function updateGeolocation(id, value) {
  const fileObj = files[id];
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
    // owner_id: 1 // Replace with the actual owner ID
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
  const fileObj = files[id];
  if (!fileObj) return;

  // const geoInput = document.getElementById(`geo-${id}`);
  // if (geoInput) {
  //   fileObj.geo_data = geoInput.value;
  // }

  const albumId = albumSelection.value; // Get the selected album ID
  if (!albumId) {
    alert('Please select or create an album first.');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileObj.file);
  if (fileObj.description != null) formData.append('description', fileObj.description);
  formData.append('visibility', fileObj.visibility);
  if (fileObj.geo_data != null) formData.append('geo_data', JSON.stringify(fileObj.geo_data));
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
  for (const file of Object.values(files)) {
    if (file.status !== 'Finished') {
      await submitFiles(file.id);
    }
  }
}

function checkAllFinished() {
  if (Object.values(files).every((file) => file.status === 'Finished')) {
    submitAllButton.textContent = 'Next';
    submitAllButton.onclick = () => window.location.href = '/';
  }
}

async function importZip() {
  // Create a hidden file input for ZIP files
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.zip';

  // When a file is chosen
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Load the ZIP file with JSZip
      const zip = await JSZip.loadAsync(file);

      // Look for 'metadata.json'
      const metadataFile = zip.file('metadata.json');
      if (!metadataFile) {
        alert('No "metadata.json" file found in the ZIP!');
        return;
      }

      // Parse metadata.json
      const metadataContent = await metadataFile.async('string');
      const metadata = JSON.parse(metadataContent);

      // We expect metadata.images to be an array
      if (!metadata.images || !Array.isArray(metadata.images)) {
        alert('The "metadata.json" does not have an "images" array.');
        return;
      }

      const dataTransfer = new DataTransfer();


      // Process each image entry in metadata
      for (const [index, imageMeta] of metadata.images.entries()) {
        const { filename, description, visibility, geo_data } = imageMeta;

        // Check if the file actually exists inside the ZIP
        const imageFileInZip = zip.file(filename);
        if (!imageFileInZip) {
          console.warn(`File "${filename}" not found in the ZIP.`);
          continue; // Skip this iteration
        }

        const blob = await imageFileInZip.async('blob');
        let mimeType = '';
        const ext = filename.toLowerCase().split('.').pop();
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
            // ... add more if you need ...
          default:
            mimeType = 'application/octet-stream';
        }
        const imageFile = new File([blob], filename, { type: mimeType });

        dataTransfer.items.add(imageFile);
        // handleSingleFile(imageFile);

        // Wait a tick so handleFiles finishes (since it uses FileReader)
        await new Promise((res) => setTimeout(res, 0));

        // Now we can find the newly added file object in 'files'.
        // The last inserted file ID is `file-[Object.keys(files).length - 1]` by your logic.
        // But to be extra robust, let’s do it by filename matching if you prefer.
        // For simplicity, we’ll rely on the index approach:
        const currentIndex = Object.keys(files).length - 1;
        const fileId = `file-${currentIndex}`;
        const fileObj = files[fileId];

        if (fileObj) {
          // Override or set the description, visibility, geo_data
          if (typeof description === 'string') {
            fileObj.description = description;
            // Update the text in the preview table for this image
            const displaySpan = document.getElementById(`description-${fileId}`);
            if (displaySpan) {
              displaySpan.textContent = description;
            }
          }

          if (typeof visibility === 'string') {
            fileObj.visibility = visibility;
            // Update the dropdown in the preview
            const visibilitySelect = document.getElementById(`visibility-${fileId}`);
            if (visibilitySelect) {
              visibilitySelect.value = visibility;
            }
          }

          if (geo_data && typeof geo_data === 'object') {
            // Expecting something like {lat: 42.6977, lng: 23.3219}
            fileObj.geo_data = geo_data;
            // If you need to update the UI for geo, you can do so here
            // e.g., let geoInput = document.getElementById(`geo-${fileId}`);
            // if (geoInput) {
            //   geoInput.value = `${geo_data.lat}, ${geo_data.lng}`;
            // }
          }
        }
      }

      fileInput.files = dataTransfer.files;
      handleFiles(dataTransfer.files);
    } catch (err) {
      console.error('Error processing ZIP:', err);
      alert(`Failed to process ZIP: ${err.message}`);
    }
  };

  // Programmatically click the file input
  input.click();
}


// Fetch albums on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchAlbums();
});


document.getElementById('editGeo').addEventListener('shown.bs.modal', initMap);