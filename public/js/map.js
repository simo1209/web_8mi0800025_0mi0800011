let map, marker;

const defaultCoords = [42.674435, 23.330431]; // Default coordinates

document.getElementById('editGeo').addEventListener('shown.bs.modal', () => {
    // Initialize map only once
    if (!map) {
      map = L.map('map').setView(defaultCoords, 13); // Default coordinates
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      marker = L.marker(defaultCoords, { draggable: true }).addTo(map);

      // Update input fields when marker is dragged
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
      });

      // Initialize input fields
      const { lat, lng } = marker.getLatLng();
      document.getElementById('latitude').value = lat.toFixed(6);
      document.getElementById('longitude').value = lng.toFixed(6);
    }

    // Resize the map after the modal is shown
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
});

function saveGeoLocation() {
    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    console.log(`Saved coordinates: Latitude: ${lat}, Longitude: ${lng}`);
    // Add your save logic here

    const id = document.getElementById('editGeo').getAttribute('data-image-id');
    files[id].geo_data = { lat, lng };

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editGeo'));
    modal.hide();
}
