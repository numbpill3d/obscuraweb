import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

document.addEventListener('DOMContentLoaded', () => {
    const imageFeed = document.getElementById('image-feed');
    const widgetContainer = document.getElementById('widget-container');
    const submitForm = document.getElementById('submit-form');

    // Initialize Supabase client
    const supabaseUrl = 'https://ibpnwppmlvlizuuxland.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53cHBtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const submissionMessage = document.getElementById('submission-message');
    const embedInstructions = document.getElementById('embed-instructions');
    const copyEmbedButton = document.getElementById('copy-embed');
    const embedCodeTextarea = document.getElementById('embed-code');


    // Function to fetch images from Supabase
    async function fetchImages() {
        const { data, error } = await supabase
            .from('submissions')
            .select('image_url, site_link, tags');

        if (error) {
            console.error('Error fetching images:', error);
            return [];
        }
        return data;
    }


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
    async function populateImageFeed() {
        imageFeed.innerHTML = ''; // Clear existing feed
        const imagesFromSupabase = await fetchImages();
        imagesFromSupabase.forEach(image => {
            imageFeed.appendChild(createImageItem(image));
        });
    }

    // Widget functionality
    async function createWidget() {
        const widgetStrip = document.getElementById('widget-strip');
        widgetStrip.innerHTML = ''; // Clear existing widget images

        const imagesFromSupabase = await fetchImages();
        // Display a subset of random images in the widget
        const shuffledImages = [...imagesFromSupabase].sort(() => 0.5 - Math.random()); // Shuffle images
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length)); // Display up to 5 random images

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.image_url; // Use image_url from Supabase data
            widgetImage.alt = image.tags; // Use tags for alt text
            widgetImage.classList.add('widget-image');
            widgetImage.addEventListener('click', () => {
                window.open(image.site_link, '_blank'); // Use site_link from Supabase data
            });
            widgetStrip.appendChild(widgetImage);
        });
    }

    // Submission form handling
    submitForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        const imageUrl = document.getElementById('image-url').value;
        const siteLink = document.getElementById('site-link').value;
        const tagsInput = document.getElementById('tags').value;
        const tagsArray = tagsInput.split(',').map(tag => tag.trim());

        // Insert submitted image data into Supabase
        const { error } = await supabase
            .from('submissions')
            .insert([
                { image_url: imageUrl, site_link: siteLink, tags: tagsArray }
            ]);

        if (error) {
            console.error('Error submitting image:', error);
            alert('Failed to submit image. Please try again.'); // Basic error feedback
        } else {
            console.log('Image submitted successfully!');
            // Show submission message and embed instructions
            submissionMessage.style.display = 'block';
            embedInstructions.style.display = 'block';
            submitForm.reset(); // Clear the form

            // Refresh image feed and widget
            populateImageFeed();
            createWidget();
        }
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