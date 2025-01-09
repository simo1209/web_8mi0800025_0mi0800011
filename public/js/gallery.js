const frontpageGallery = document.querySelector('#frontpage-gallery');
const imageCardTemplate = document.querySelector('#image-card-template');

try {
  let images_request = await fetch('/images.json');
  let images = await images_request.json();

  for (const image of images) {
    console.log(image);  
    const imageCardClone = imageCardTemplate.content.cloneNode(true);


    imageCardClone.querySelector('.image-card').setAttribute('src', `images/${image.filename}`);
    imageCardClone.querySelector('.image-description').textContent = image.description;

    frontpageGallery.append(imageCardClone);
  }
} catch (err) {
  console.error(err);
}

