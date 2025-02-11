
let images;

document.addEventListener('DOMContentLoaded', async () => {
    try {

        
        const urlParams = new URLSearchParams(window.location.search);
        const imageId = urlParams.get('image_id');

        if ( imageId ) {
          console.log('image_id', imageId);
          const imagesRequest = await fetch(`app.php?command=get_image_by_id&image_id=${imageId}`);
          images = [ await imagesRequest.json() ];
        } else {
          const imagesRequest = await fetch('app.php?command=latest_images');
          images = await imagesRequest.json();
        }


        // for (const image of images) {
        //   console.log(image);
        //   const imageCardClone = imageCardTemplate.content.cloneNode(true);

        //   // Set image source and description
        //   const imageEl = imageCardClone.querySelector('.image-card');
        //   imageEl.setAttribute('src', `/app.php?command=image&image_id=${image.image_id}`);
        //   // imageEl.setAttribute('data-image-id', image.image_id);
        //   imageEl.addEventListener('click', () => viewImage(image));

        //   imageCardClone.querySelector('.image-description').textContent = image.descr;

        //   // Set album link
        //   const albumLink = imageCardClone.querySelector('.album-link');
        //   albumLink.textContent = `Album: ${image.album_name}`;
        //   albumLink.setAttribute('href', `/album.html?album_id=${image.album_id}`);

        //   // Calculate and set "time since" field
        //   const timeSinceText = timeSince(image.created_at);
        //   imageCardClone.querySelector('.image-time-since').textContent = timeSinceText;

        //   frontpageGallery.append(imageCardClone);
        // }

        initMap();
    } catch (err) {
        console.error(err);
    }

});

const defaultCoords = [42.674435, 23.330431]; // Default coordinates

let map;
let markers = [];

function initMap() {
    // Initialize map only once
    if (!map) {
        map = L.map('map').setView(defaultCoords, 13); // Default coordinates
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        for (const image of images) {
            let geoDataWithRandomNoise = Object.values(JSON.parse(image.geo_data));
            geoDataWithRandomNoise[0] += Math.random() * 0.0001;
            geoDataWithRandomNoise[1] += Math.random() * 0.0001;
            let marker = L.marker(geoDataWithRandomNoise, { draggable: false }).addTo(map);

            // // Update input fields when marker is dragged
            // marker.on('dragend', () => {
            //   const { lat, lng } = marker.getLatLng();
            //   document.getElementById('latitude').value = lat.toFixed(6);
            //   document.getElementById('longitude').value = lng.toFixed(6);
            // });

            // Show image

            marker.on('click', () => {
                document.querySelector('#viewImage img').setAttribute('src', `app.php?command=image&image_id=${image.image_id}`);
                new bootstrap.Modal(document.getElementById('viewImage')).show();
            });

            markers.push(marker);
        }



    }

    // Resize the map after the modal is shown
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

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
