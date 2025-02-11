const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageId = new URLSearchParams(window.location.search).get('image_id')
const image = new Image();
image.src = `app.php?command=image&image_id=${imageId}`;


document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch(`app.php?command=get_image_by_id&image_id=${imageId}`);
    const image = await response.json();
    document.querySelector('#image-description').textContent = image.descr;
    document.querySelector('#image-visibility').value = image.visibility;

    initMap(Object.values(JSON.parse(image.geo_data)));
});

document.querySelector('#save-btn').addEventListener('click', async () => {
    const visibility = document.querySelector('#image-visibility').value;
    const descr = document.querySelector('#image-description').value;
    const geoData = JSON.stringify(marker.getLatLng());

    const response = await fetch('app.php?command=update_image_by_id', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            descr,
            image_id: imageId,
            visibility,
            geo_data: geoData,
        }),
    });

    if (response.ok) {
        document.querySelector('#save-btn').textContent = 'Saved!';
        window.location.href = 'my_albums.html';
    } else {
        alert('Failed to save image');
    }
});

document.querySelector('#delete-btn').addEventListener('click', async () => {
    const response = await fetch(`app.php?command=delete_image_by_id&image_id=${imageId}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        window.location.href = 'my_albums.html';
    } else {
        alert('Failed to delete image');
    }
});

const cropRect = { x: 50, y: 50, width: 200, height: 150 };

image.onload = function () {
    // Calculate canvas size to fit within the container
    const maxCanvasWidth = 600; // Fixed width for better UI alignment
    const maxCanvasHeight = 400;

    const aspectRatio = image.width / image.height;

    if (aspectRatio > 1) {
        canvas.width = maxCanvasWidth;
        canvas.height = maxCanvasWidth / aspectRatio;
    } else {
        canvas.height = maxCanvasHeight;
        canvas.width = maxCanvasHeight * aspectRatio;
    }

    draw();
};

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw crop rectangle
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
}

function setCropSize(width, height) {
    cropRect.width = width;
    cropRect.height = height;

    // Center the crop rectangle
    cropRect.x = (canvas.width - width) / 2;
    cropRect.y = (canvas.height - height) / 2;

    draw();
}

function setCropWidth(width) {
    cropRect.width = width;
    // cropRect.height = height;

    // Center the crop rectangle
    cropRect.x = (canvas.width - width) / 2;
    cropRect.y = (canvas.height - cropRect.height) / 2;

    draw();
}

function setCropHeight(height) {
    // cropRect.width = width;
    cropRect.height = height;

    // Center the crop rectangle
    cropRect.x = (canvas.width - cropRect.width) / 2;
    cropRect.y = (canvas.height - height) / 2;

    draw();
}


let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
        mouseX >= cropRect.x &&
        mouseX <= cropRect.x + cropRect.width &&
        mouseY >= cropRect.y &&
        mouseY <= cropRect.y + cropRect.height
    ) {
        isDragging = true;
        dragOffsetX = mouseX - cropRect.x;
        dragOffsetY = mouseY - cropRect.y;
    }
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        cropRect.x = mouseX - dragOffsetX;
        cropRect.y = mouseY - dragOffsetY;

        // Keep the crop rectangle within canvas bounds
        cropRect.x = Math.max(0, Math.min(cropRect.x, canvas.width - cropRect.width));
        cropRect.y = Math.max(0, Math.min(cropRect.y, canvas.height - cropRect.height));

        draw();
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

function cropImage() {
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropRect.width;
    croppedCanvas.height = cropRect.height;
    const croppedCtx = croppedCanvas.getContext("2d");

    croppedCtx.drawImage(
        image,
        (cropRect.x / canvas.width) * image.width,
        (cropRect.y / canvas.height) * image.height,
        (cropRect.width / canvas.width) * image.width,
        (cropRect.height / canvas.height) * image.height,
        0,
        0,
        cropRect.width,
        cropRect.height
    );

    const link = document.createElement("a");
    link.download = "cropped-image.png";
    link.href = croppedCanvas.toDataURL();
    // link.click();

    document.querySelector('#crop-btn').innerHTML = 'Cropped!';
}
