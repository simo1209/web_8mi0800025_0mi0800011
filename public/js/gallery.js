const frontpageGallery = document.querySelector('#frontpage-gallery');
const imageCardTemplate = document.querySelector('#image-card-template');

// Helper function to calculate time since a date
function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

function viewImage(image, imageEl) {
  document.querySelector('#viewImage img').setAttribute('src', `/app.php?command=image&image_id=${image.image_id}`);
  new bootstrap.Modal(document.getElementById('viewImage')).show();
}

try {
  const imagesRequest = await fetch('/app.php?command=latest_images');
  const images = await imagesRequest.json();

  for (const image of images) {
    console.log(image);
    const imageCardClone = imageCardTemplate.content.cloneNode(true);

    // Set image source and description
    const imageEl = imageCardClone.querySelector('.image-card');
    imageEl.setAttribute('src', `/app.php?command=image&image_id=${image.image_id}`);
    // imageEl.setAttribute('data-image-id', image.image_id);
    imageEl.addEventListener('click', () => viewImage(image, imageEl));

    imageCardClone.querySelector('.image-description').textContent = image.descr;

    // Set album link
    const albumLink = imageCardClone.querySelector('.album-link');
    albumLink.textContent = `Album: ${image.album_name}`;
    albumLink.setAttribute('href', `/album.html?album_id=${image.album_id}`);

    // Calculate and set "time since" field
    const timeSinceText = timeSince(image.created_at);
    imageCardClone.querySelector('.image-time-since').textContent = timeSinceText;

    frontpageGallery.append(imageCardClone);
  }
} catch (err) {
  console.error(err);
}