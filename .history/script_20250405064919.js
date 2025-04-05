// Initialize Supabase client
const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', () => {
    const imageFeed = document.getElementById('image-feed');
    const widgetContainer = document.getElementById('widget-container');
    const submitForm = document.getElementById('submit-form');
    const submissionMessage = document.getElementById('submission-message');
    const embedInstructions = document.getElementById('embed-instructions');
    const copyEmbedButton = document.getElementById('copy-embed');
    const embedCodeTextarea = document.getElementById('embed-code');

    // Windows 98 style alert function
    function win98Alert(message) {
        // Create alert container
        const alertContainer = document.createElement('div');
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '50%';
        alertContainer.style.left = '50%';
        alertContainer.style.transform = 'translate(-50%, -50%)';
        alertContainer.style.zIndex = '9999';

        // Create Windows 98 style box
        const win98Box = document.createElement('div');
        win98Box.style.border = '2px solid';
        win98Box.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        win98Box.style.backgroundColor = '#c0c0c0';
        win98Box.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)';
        win98Box.style.padding = '2px';
        win98Box.style.width = '300px';

        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.style.background = 'linear-gradient(90deg, #000080, #1084d0)';
        titleBar.style.color = 'white';
        titleBar.style.fontWeight = 'bold';
        titleBar.style.padding = '3px 5px';
        titleBar.style.display = 'flex';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.alignItems = 'center';
        titleBar.innerHTML = '<span>THE UNDERWEB</span><span>X</span>';

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.style.padding = '15px';
        contentArea.style.backgroundColor = '#c0c0c0';
        contentArea.style.textAlign = 'center';

        // Add message
        const messageText = document.createElement('p');
        messageText.textContent = message;
        messageText.style.margin = '0 0 15px 0';

        // Add OK button
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.style.padding = '5px 20px';
        okButton.style.border = '2px solid';
        okButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        okButton.style.backgroundColor = '#c0c0c0';
        okButton.style.cursor = 'pointer';

        okButton.addEventListener('click', () => {
            document.body.removeChild(alertContainer);
        });

        // Assemble the alert
        contentArea.appendChild(messageText);
        contentArea.appendChild(okButton);
        win98Box.appendChild(titleBar);
        win98Box.appendChild(contentArea);
        alertContainer.appendChild(win98Box);

        // Add to body
        document.body.appendChild(alertContainer);
    }

    // Function to create image items for the feed
    function createImageItem(image) {
        const item = document.createElement('div');
        item.classList.add('image-item');

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.alt || image.tags;

        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('tags');
        tagsDiv.textContent = image.tags;

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
        if (!imageFeed) return;

        imageFeed.innerHTML = ''; // Clear existing feed

        // Use placeholder images
        const placeholders = [
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+1', link: '#', tags: 'placeholder, web1.0, retro' },
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+2', link: '#', tags: 'placeholder, windows98, aesthetic' },
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+3', link: '#', tags: 'placeholder, neocities, webring' },
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+4', link: '#', tags: 'placeholder, pixel, art' },
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+5', link: '#', tags: 'placeholder, vaporwave, glitch' },
            { src: 'https://via.placeholder.com/200/c0c0c0/000000?text=THE+UNDERWEB+6', link: '#', tags: 'placeholder, indie, web' }
        ];

        placeholders.forEach(image => {
            try {
                imageFeed.appendChild(createImageItem(image));
            } catch (error) {
                console.error('Error loading placeholder image:', image, error);
            }
        });
    }

    // Widget functionality
    function createWidget() {
        const widgetStrip = document.getElementById('widget-strip');
        if (!widgetStrip) return;

        widgetStrip.innerHTML = ''; // Clear existing widget images

        // Use placeholder images
        const imagesToUse = [
            { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W1', link: '#', tags: 'placeholder' },
            { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W2', link: '#', tags: 'placeholder' },
            { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W3', link: '#', tags: 'placeholder' },
            { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W4', link: '#', tags: 'placeholder' },
            { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W5', link: '#', tags: 'placeholder' }
        ];

        // Display a subset of random images in the widget
        const shuffledImages = [...imagesToUse].sort(() => 0.5 - Math.random()); // Shuffle images
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length)); // Display up to 5 random images

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.src;
            widgetImage.alt = image.tags;
            widgetImage.classList.add('widget-image');
            widgetImage.addEventListener('click', () => {
                window.open(image.link, '_blank');
            });
            widgetStrip.appendChild(widgetImage);
        });
    }

    // Submission form handling
    if (submitForm) {
        submitForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            const imageUpload = document.getElementById('image-upload').files[0];
            const imageUrl = document.getElementById('image-url').value;
            const siteLink = document.getElementById('site-link').value;
            const tagsInput = document.getElementById('tags').value;

            let submittedImageUrl = '';

            if (imageUpload) {
                // Handle image upload to Supabase Storage
                const timestamp = Date.now();
                const imageName = `image-${timestamp}-${imageUpload.name}`;

                supabase.storage
                    .from('images')
                    .upload(imageName, imageUpload)
                    .then(uploadResult => {
                        if (uploadResult.error) {
                            win98Alert('Error uploading image: ' + uploadResult.error.message);
                            return;
                        }

                        // Get public URL from storage
                        supabase.storage
                            .from('images')
                            .getPublicUrl(imageName)
                            .then(urlResult => {
                                if (urlResult.error) {
                                    win98Alert('Error getting public URL: ' + urlResult.error.message);
                                    return;
                                }
                                submittedImageUrl = urlResult.data.publicUrl;
                                // Continue with submission process after getting URL
                                if (submittedImageUrl) {
                                    // Create new image item and add to feed
                                    const newImage = {
                                        src: submittedImageUrl,
                                        link: siteLink,
                                        tags: tagsInput
                                    };
                                    imageFeed.prepend(createImageItem(newImage));

                                    // Show submission message
                                    if (submissionMessage) {
                                        submissionMessage.style.display = 'block';
                                    }

                                    // Show embed instructions if they exist
                                    if (embedInstructions) {
                                        embedInstructions.style.display = 'block';
                                    }

                                    submitForm.reset(); // Clear the form
                                    win98Alert('Image submitted successfully!'); // Windows 98 style alert
                                }
                            });
                    });
                    return; // Stop further execution, wait for async upload to complete
            } else if (imageUrl) {
                submittedImageUrl = imageUrl;
            } else {
                win98Alert('Please upload an image or provide an image URL.');
                return; // Stop submission if no image provided
            }

            // Create new image item and add to feed
            const newImage = {
                src: submittedImageUrl,
                link: siteLink,
                tags: tagsInput
            };
            imageFeed.prepend(createImageItem(newImage));

            // Show submission message
            if (submissionMessage) {
                submissionMessage.style.display = 'block';
            }

            // Show embed instructions if they exist
            if (embedInstructions) {
                embedInstructions.style.display = 'block';
            }

            submitForm.reset(); // Clear the form
            win98Alert('Image submitted successfully!'); // Windows 98 style alert
        });
    }

    // Copy embed code functionality
    if (copyEmbedButton && embedCodeTextarea) {
        copyEmbedButton.addEventListener('click', () => {
            embedCodeTextarea.select();
            document.execCommand('copy');
            win98Alert('Embed code copied to clipboard!'); // Windows 98 style alert
        });
    }

    // Add click handlers to window title bar X buttons
    document.querySelectorAll('.win98-box-title span:last-child').forEach(closeButton => {
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', function() {
            const parentBox = this.closest('.win98-box');
            if (parentBox) {
                parentBox.style.display = 'none';

                // Show a "restore" button somewhere
                setTimeout(() => {
                    parentBox.style.display = 'block';
                }, 3000); // Auto-restore after 3 seconds for demo purposes
            }
        });
    });

    // Initialize the page
    populateImageFeed();
    createWidget();
});