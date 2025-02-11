const urlParams = new URLSearchParams(window.location.search);
const albumId = urlParams.get('album_id');
const albumTitle = document.getElementById('album-title');
const imageList = document.getElementById('image-list');
const imageCardTemplate = document.getElementById('image-card-template');
const downloadAlbumBtn = document.getElementById('download-album-btn');

// Helper function to calculate time since a date
function timeSince(date) {
    let dateDiff = new Date() - new Date(date) - (2 * 60 * 60 * 1000); // I 
  const seconds = Math.floor(dateDiff) / 1000;
    
    // am perfectly aware timezones dont work like this
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

function viewImage(image) {
    document.querySelector('#viewImage img').setAttribute('src', `app.php?command=image&image_id=${image.dbname}`);
    new bootstrap.Modal(document.getElementById('viewImage')).show();
}

async function fetchAlbumImages() {
    try {
        const response = await fetch(`app.php?command=album_images&album_id=${albumId}`);
        const images = await response.json();

        // Set album title
        if (images.length > 0 && images[0].album_name) {
            albumTitle.textContent = images[0].album_name;
        } else {
            albumTitle.textContent = `Album #${albumId}`;
        }

        // Populate the album images
        images.forEach((image) => {
            const imageCard = imageCardTemplate.content.cloneNode(true);

            // Set image source and description
            imageCard.querySelector('.image-card').setAttribute(
                'src',
                `app.php?command=image&image_id=${image.dbname}`
            );
            imageCard.querySelector('.image-card').addEventListener('click', () => viewImage(image));
            imageCard.querySelector('.image-description').textContent = image.descr;

            imageCard.querySelector('.card-body a').setAttribute(
                'href',
                `edit.html?image_id=${image.dbname}`
            );


            // Set "time since"
            const timeSinceText = timeSince(image.created_at);
            imageCard.querySelector('.image-time-since').textContent = timeSinceText;

            imageList.appendChild(imageCard);
        });
    } catch (error) {
        console.error('Error fetching album images:', error);
    }
}

document.getElementById('download-album-btn').addEventListener('click', async (event) => {
    event.preventDefault();

    if (!albumId) {
        alert("Album ID is missing!");
        return;
    }

    try {
        // Fetch album data
        const response = await fetch(`app.php?command=export_album&album_id=${albumId}`);
        const albumData = await response.json();

        if (albumData.error) {
            alert(albumData.error);
            return;
        }

        const zip = new JSZip();
        const albumFolder = zip.folder(`album_${albumId}`);

        // Add metadata file
        albumFolder.file("metadata.json", JSON.stringify(albumData, null, 2));

        // Download images and add them to zip
        const imagePromises = albumData.images.map(async (image) => {
            const imageResponse = await fetch(image.url);
            const blob = await imageResponse.blob();
            albumFolder.file(image.dbname + '.jpg', blob);
        });

        await Promise.all(imagePromises);

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ type: "blob" });

        // Trigger download
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = `album_${albumId}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

    } catch (error) {
        console.error("Error exporting album:", error);
        alert("Failed to export album.");
    }
});


fetchAlbumImages();