const albumList = document.getElementById('album-list');
const albumCardTemplate = document.getElementById('album-card-template');

async function fetchAlbums() {
    try {
        const response = await fetch('/app.php?command=my_albums');
        const albums = await response.json();

        if (albums.length !== 0) {
            document.getElementById('no-albums-warning').style.display = 'none';
        }

        albums.forEach((album) => {
            const albumCard = albumCardTemplate.content.cloneNode(true);

            albumCard.querySelector('.album-name').textContent = album.name;
            albumCard.querySelector('.album-description').textContent = album.descr;
            albumCard.querySelector('.view-album').setAttribute(
                'href',
                `/album.html?album_id=${album.id}`
            );

            albumList.appendChild(albumCard);
        });
    } catch (error) {
        console.error('Error fetching albums:', error);
    }
}

fetchAlbums();