document.addEventListener('DOMContentLoaded', () => {
    const imageFeed = document.getElementById('image-feed');
    const widgetContainer = document.getElementById('widget-container');
    const submitForm = document.getElementById('submit-form');
    const submissionMessage = document.getElementById('submission-message');
    const embedInstructions = document.getElementById('embed-instructions');
    const copyEmbedButton = document.getElementById('copy-embed');
    const embedCodeTextarea = document.getElementById('embed-code');

    // Placeholder image data (replace with actual data fetching later)
    let images = [
        { src: 'https://via.placeholder.com/150/f0f/fff?text=Image+1', alt: 'Image 1', tags: ['cyberpunk', 'neon'], link: '#' },
        { src: 'https://via.placeholder.com/150/0f0/000?text=Image+2', alt: 'Image 2', tags: ['glitch', 'abstract'], link: '#' },
        { src: 'https://via.placeholder.com/150/00f/fff?text=Image+3', alt: 'Image 3', tags: ['dreamcore', 'zine'], link: '#' },
        { src: 'https://via.placeholder.com/150/ff0/000?text=Image+4', alt: 'Image 4', tags: ['haunted', 'occult'], link: '#' },
        { src: 'https://via.placeholder.com/150/f00/fff?text=Image+5', alt: 'Image 5', tags: ['retro', '80s'], link: '#' }
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
        imageFeed.innerHTML = ''; // Clear existing feed
        images.forEach(image => {
            imageFeed.appendChild(createImageItem(image));
        });
    }

    // Widget functionality
    function createWidget() {
        const widgetStrip = document.getElementById('widget-strip');
        widgetStrip.innerHTML = ''; // Clear existing widget images

        // Display a subset of random images in the widget
        const shuffledImages = [...images].sort(() => 0.5 - Math.random()); // Shuffle images
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length)); // Display up to 5 random images

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
    }

    // Submission form handling
    submitForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const imageUrl = document.getElementById('image-url').value;
        const siteLink = document.getElementById('site-link').value;
        const tagsInput = document.getElementById('tags').value;
        const tagsArray = tagsInput.split(',').map(tag => tag.trim());

        // Simulate adding the submitted image to the feed (no backend persistence)
        images.unshift({ src: imageUrl, alt: 'User Submitted Image', tags: tagsArray, link: siteLink });
        populateImageFeed();
        createWidget(); // Update widget with new images

        // Show submission message and embed instructions
        submissionMessage.style.display = 'block';
        embedInstructions.style.display = 'block';
        submitForm.reset(); // Clear the form
    });

    // Copy embed code functionality
    copyEmbedButton.addEventListener('click', () => {
        embedCodeTextarea.select();
        document.execCommand('copy');
        alert('Embed code copied to clipboard!'); // Basic feedback
    });

    populateImageFeed();
    createWidget();
});
</script>