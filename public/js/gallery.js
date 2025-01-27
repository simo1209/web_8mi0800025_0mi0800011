const frontpageGallery = document.querySelector('#frontpage-gallery');
const imageCardTemplate = document.querySelector('#image-card-template');

try {
  let images_request = await fetch('/app.php?command=latest_images');
  let images = await images_request.json();

  for (const image of images) {
    console.log(image);  
    const imageCardClone = imageCardTemplate.content.cloneNode(true);


    imageCardClone.querySelector('.image-card').setAttribute('src', `/app.php?command=image&image_id=${image.image_id}`);
    imageCardClone.querySelector('.image-description').textContent = image.descr;

    frontpageGallery.append(imageCardClone);
  }
} catch (err) {
  console.error(err);
}

