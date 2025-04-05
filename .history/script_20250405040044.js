document.addEventListener('DOMContentLoaded', () => {
    const imageFeed = document.getElementById('image-feed');
    const widgetContainer = document.getElementById('widget-container');

    // Placeholder image data (replace with actual data fetching later)
    const images = [
        { src: 'https://via.placeholder.com/150', alt: 'Image 1', tags: ['tag1', 'tag2'], link: '#' },
        { src: 'https://via.placeholder.com/150', alt: 'Image 2', tags: ['tag3', 'tag4'], link: '#' },
        { src: 'https://via.placeholder.com/150', alt: 'Image 3', tags: ['tag5', 'tag6'], link: '#' },
        { src: 'https://via.placeholder.com/150', alt: 'Image 4', tags: ['tag7', 'tag8'], link: '#' },
        { src: 'https://via.placeholder.com/150', alt: 'Image 5', tags: ['tag9', 'tag10'], link: '#' }
    ];

    // Function to create image items for the feed
    function createImageItem(image) {
        const item = document.createElement('div');
        item.classList.add('image-item');

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt;

        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('tags');
        tagsDiv.textContent = image.tags.join(', ');

        const link = document.createElement('a');
        link.href = image.link;
        link.target = '_blank'; // Open link in new tab
        link.appendChild(img);

        item.appendChild(link);
        item.appendChild(tagsDiv);

        return item;
    }

    // Function to populate the image feed
    function populateImageFeed() {
        images.forEach(image => {
            imageFeed.appendChild(createImageItem(image));
        });
    }

    populateImageFeed();

    // Widget functionality (basic placeholder for now)
    function createWidget() {
        const widgetStrip = document.createElement('div');
        widgetStrip.id = 'widget-strip';

        // Display a subset of images in the widget
        const widgetImages = images.slice(0, Math.min(5, images.length)); // Display up to 5 images

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.src;
            widgetImage.alt = image.alt;
            widgetImage.classList.add('widget-image');
            widgetImage.addEventListener('click', () => {
                window.open(image.link, '_blank');
            });
            widgetStrip.appendChild(widgetImage);
        });

        widgetContainer.appendChild(widgetStrip);
    }

    createWidget();

    // Placeholder for submission functionality (will need backend)
    function setupSubmission() {
        // Logic to detect widget and show submission corner (to be implemented)
        console.log('Submission setup placeholder');
    }

    setupSubmission();
});
</script>