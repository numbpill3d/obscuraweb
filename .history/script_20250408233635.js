// Initialize Supabase client globally
let supabaseClient = null;

document.addEventListener('DOMContentLoaded', async () => {
    const imageFeed = document.getElementById('image-feed');
    const submittedLinks = document.getElementById('submitted-links');
    console.log('imageFeed element:', imageFeed);
    console.log('submittedLinks element:', submittedLinks);
    const widgetContainer = document.getElementById('widget-container');
    const submitForm = document.getElementById('submit-form');
    const submissionMessage = document.getElementById('submission-message');
    const embedInstructions = document.getElementById('embed-instructions');
    const copyEmbedButton = document.getElementById('copy-embed');
    const embedCodeTextarea = document.getElementById('embed-code');

    // Initialize Supabase client
    async function initSupabase() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase library not found');
            }

            console.log('Initializing Supabase client...');
            
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            
            // Create Supabase client
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Verify storage bucket exists and is accessible
            const { data: buckets, error: bucketsError } = await supabaseClient
                .storage
                .listBuckets();

            if (bucketsError) {
                throw new Error(`Storage error: ${bucketsError.message}`);
            }

            const imagesBucket = buckets.find(b => b.name === 'images');
            if (!imagesBucket) {
                console.log('Creating images bucket...');
                const { error: createError } = await supabaseClient
                    .storage
                    .createBucket('images', {
                        public: true,
                        allowedMimeTypes: ['image/*'],
                        fileSizeLimit: 5242880 // 5MB
                    });

                if (createError) {
                    throw new Error(`Failed to create bucket: ${createError.message}`);
                }
            }

            // Verify the connection works
            const isConnected = await verifySupabaseConnection();
            if (!isConnected) {
                throw new Error('Failed to verify Supabase connection');
            }

            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            displayPlaceholderImages();
            return false;
        }
    }

    // Function to verify Supabase connection
    async function verifySupabaseConnection() {
        if (!supabaseClient) return false;
        
        try {
            // Try a simple query to verify the connection
            const { error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Supabase connection verification failed:', error);
                return false;
            }
            
            console.log('Supabase connection verified successfully');
            return true;
        } catch (error) {
            console.error('Error verifying Supabase connection:', error);
            return false;
        }
    }

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
        console.log('createImageItem called with image:', image);
        const item = document.createElement('div');
        item.classList.add('image-item');

        const img = document.createElement('img');
        // Handle both image.image_url (from Supabase) and image.src (from form submission)
        img.src = image.image_url || image.src;
        img.alt = image.alt || image.tags;

        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('tags');
        tagsDiv.textContent = image.tags;

        const link = document.createElement('a');
        // Handle both image.site_url (from Supabase) and image.link (from form submission)
        link.href = image.site_url || image.link;
        link.target = '_blank'; // Open link in new tab
        link.appendChild(img);

        item.appendChild(link);
        item.appendChild(tagsDiv);

        return item;
    }

    // Function to save image data to Supabase database
    async function saveImageToDatabase(imageData) {
        if (!supabaseClient) {
            console.error('Cannot save to database: Supabase client not initialized');
            return false;
        }
        
        try {
            // Convert the image data to match your database schema
            const dbImageData = {
                image_url: imageData.src,
                site_url: imageData.link,
                tags: imageData.tags
                // Let Supabase handle the created_at timestamp with its defaults
            };
            
            console.log('Saving image to database:', dbImageData);
            
            // Insert the image data into the 'images' table
            const { data, error } = await supabaseClient
                .from('images')
                .insert([dbImageData]);
                
            if (error) {
                console.error('Error saving image to database:', error);
                console.error('Full error object:', error); // Log full error object
                win98Alert('Error saving image to database: ' + error.message);
                return false;
            }
            
            console.log('Image saved to database successfully:', data);
            return true;
        } catch (error) {
            console.error('Exception saving image to database:', error);
            win98Alert('Error saving image: ' + error.message);
            return false;
        }
    }

    // Function to populate the image feed from Supabase
    async function populateImageFeed() {
        console.log('populateImageFeed called');
        const targetElement = imageFeed || submittedLinks;
        if (!targetElement) return;

        targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : ''; // Clear existing feed, preserve header if on links page

        // First try to load from local storage as a quick fallback
        const localImages = loadFromLocalStorage();
        if (localImages && localImages.length > 0) {
            console.log('Loaded images from local storage');
            localImages.forEach(image => {
                targetElement.appendChild(createImageItem(image));
            });
        }

        // Then try to load from Supabase if available
        if (supabaseClient) {
            try {
                console.log('Fetching images from Supabase database');
                const { data: images, error } = await supabaseClient
                    .from('images')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching images from Supabase:', error);
                    console.error('Full error object:', error); // Log full error object
                    
                    // Don't show alert for API key errors, just use local storage
                    if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                        win98Alert('Error loading images: ' + error.message);
                    }
                    
                    // If we didn't already load from local storage, show placeholders
                    if (!localImages || localImages.length === 0) {
                        displayPlaceholderImages();
                    }
                    return;
                }

                console.log('Images fetched from database:', images);
                
                // Clear any local storage images to show the fresh data
                if (images && images.length > 0) {
                    targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : '';
                    
                    images.forEach(image => {
                        // Map database fields to the format expected by createImageItem
                        const displayImage = {
                            image_url: image.image_url,
                            src: image.image_url,
                            site_url: image.site_url,
                            link: image.site_url,
                            tags: image.tags,
                            alt: image.tags
                        };
                        targetElement.appendChild(createImageItem(displayImage));
                    });
                } else {
                    console.log('No images found in Supabase.');
                    // If we didn't already load from local storage, show placeholders
                    if (!localImages || localImages.length === 0) {
                        displayPlaceholderImages();
                    }
                }
            } catch (error) {
                console.error('Error populating image feed:', error);
                
                // Don't show alert for connection errors if we have local storage
                if (!localImages || localImages.length === 0) {
                    // Only show alert for non-connection errors
                    if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                        win98Alert('Error loading images: ' + error.message);
                    }
                    displayPlaceholderImages();
                }
            }
        } else {
            console.error('Supabase client not initialized.');
            // If we didn't already load from local storage, show placeholders
            if (!localImages || localImages.length === 0) {
                displayPlaceholderImages();
            }
        }
    }
    
    // Function to display placeholder images when Supabase fails
    function displayPlaceholderImages() {
        if (!imageFeed) return;
        
        console.log('Displaying placeholder images');
        
        // Clear any existing content
        imageFeed.innerHTML = '';
        
        // First try to load from local storage
        const localImages = loadFromLocalStorage();
        if (localImages && localImages.length > 0) {
            console.log('Using images from local storage');
            localImages.forEach(image => {
                imageFeed.appendChild(createImageItem(image));
            });
            return;
        }
        
        // If no local storage images, use placeholders
        const placeholderImages = [
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+1',
                link: '#',
                tags: 'placeholder, sample'
            },
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+2',
                link: '#',
                tags: 'placeholder, example'
            },
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+3',
                link: '#',
                tags: 'placeholder, demo'
            }
        ];
        
        placeholderImages.forEach(image => {
            imageFeed.appendChild(createImageItem(image));
        });
    }
    
    // Local storage fallback functions
    function saveToLocalStorage(image) {
        try {
            let images = loadFromLocalStorage() || [];
            images.unshift(image); // Add new image to the beginning
            localStorage.setItem('underweb_images', JSON.stringify(images));
            console.log('Saved image to local storage');
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const savedImages = localStorage.getItem('underweb_images');
            if (savedImages) {
                return JSON.parse(savedImages);
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
        }
        return null;
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
        submitForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const imageUpload = document.getElementById('image-upload').files[0];
            const imageUrl = document.getElementById('image-url').value;
            const siteLink = document.getElementById('site-link').value;
            const tagsInput = document.getElementById('tags').value;

            let submittedImageUrl = '';

            if (imageUpload) {
                try {
                    if (!supabaseClient) {
                        throw new Error('Supabase client not initialized');
                    }

                    // Create a unique file name
                    const timestamp = Date.now();
                    const fileExt = imageUpload.name.split('.').pop();
                    const fileName = `${timestamp}.${fileExt}`;
                    const filePath = `public/${fileName}`;

                    console.log('Uploading file:', fileName);

                    // Upload the file to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabaseClient
                        .storage
                        .from('images')
                        .upload(filePath, imageUpload, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: imageUpload.type
                        });
                if (submissionMessage) {
                    submissionMessage.style.display = 'block';
                }

                // Show embed instructions if they exist
                if (embedInstructions) {
                    embedInstructions.style.display = 'block';
                }

                submitForm.reset(); // Clear the form
                win98Alert('Image submitted successfully!'); // Windows 98 style alert
            } else {
                win98Alert('Please upload an image or provide an image URL.');
                return; // Stop submission if no image provided
            }
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

    // Function to verify Supabase connection
    async function verifySupabaseConnection() {
        if (!supabaseClient) return false;
        
        try {
            // Try a simple query to verify the connection
            const { error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Supabase connection verification failed:', error);
                return false;
            }
            
            console.log('Supabase connection verified successfully');
            return true;
        } catch (error) {
            console.error('Error verifying Supabase connection:', error);
            return false;
        }
    }

    // Initialize Supabase client
    async function initSupabase() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase library not found');
            }

            console.log('Initializing Supabase client...');
            
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            
            // Create Supabase client
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Verify storage bucket exists and is accessible
            const { data: buckets, error: bucketsError } = await supabaseClient
                .storage
                .listBuckets();

            if (bucketsError) {
                throw new Error(`Storage error: ${bucketsError.message}`);
            }

            const imagesBucket = buc
// Initialize Supabase client globally
let supabaseClient = null;

document.addEventListener('DOMContentLoaded', () => {
    const imageFeed = document.getElementById('image-feed');
    const submittedLinks = document.getElementById('submitted-links');
    console.log('imageFeed element:', imageFeed);
    console.log('submittedLinks element:', submittedLinks);
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
        console.log('createImageItem called with image:', image);
        const item = document.createElement('div');
        item.classList.add('image-item');

        const img = document.createElement('img');
        // Handle both image.image_url (from Supabase) and image.src (from form submission)
        img.src = image.image_url || image.src;
        img.alt = image.alt || image.tags;

        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('tags');
        tagsDiv.textContent = image.tags;

        const link = document.createElement('a');
        // Handle both image.site_url (from Supabase) and image.link (from form submission)
        link.href = image.site_url || image.link;
        link.target = '_blank'; // Open link in new tab
        link.appendChild(img);

        item.appendChild(link);
        item.appendChild(tagsDiv);

        return item;
    }

    // Function to save image data to Supabase database
    async function saveImageToDatabase(imageData) {
        if (!supabaseClient) {
            console.error('Cannot save to database: Supabase client not initialized');
            return false;
        }
        
        try {
            // Convert the image data to match your database schema
            const dbImageData = {
                image_url: imageData.src,
                site_url: imageData.link,
                tags: imageData.tags
                // Let Supabase handle the created_at timestamp with its defaults
            };
            
            console.log('Saving image to database:', dbImageData);
            
            // Insert the image data into the 'images' table
            const { data, error } = await supabaseClient
                .from('images')
                .insert([dbImageData]);
                
            if (error) {
                console.error('Error saving image to database:', error);
                console.error('Full error object:', error); // Log full error object
                win98Alert('Error saving image to database: ' + error.message);
                return false;
            }
            
            console.log('Image saved to database successfully:', data);
            return true;
        } catch (error) {
            console.error('Exception saving image to database:', error);
            win98Alert('Error saving image: ' + error.message);
            return false;
        }
    }

    // Function to populate the image feed from Supabase
    async function populateImageFeed() {
        console.log('populateImageFeed called');
        const targetElement = imageFeed || submittedLinks;
        if (!targetElement) return;

        targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : ''; // Clear existing feed, preserve header if on links page

        // First try to load from local storage as a quick fallback
        const localImages = loadFromLocalStorage();
        if (localImages && localImages.length > 0) {
            console.log('Loaded images from local storage');
            localImages.forEach(image => {
                imageFeed.appendChild(createImageItem(image));
            });
        }

        // Then try to load from Supabase if available
        if (supabaseClient) {
            try {
                console.log('Fetching images from Supabase database');
                const { data: images, error } = await supabaseClient
                    .from('images')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching images from Supabase:', error);
                    console.error('Full error object:', error); // Log full error object
                    
                    // Don't show alert for API key errors, just use local storage
                    if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                        win98Alert('Error loading images: ' + error.message);
                    }
                    
                    // If we didn't already load from local storage, show placeholders
                    if (!localImages || localImages.length === 0) {
                        displayPlaceholderImages();
                    }
                    return;
                }

                console.log('Images fetched from database:', images);
                
                // Clear any local storage images to show the fresh data
                if (images && images.length > 0) {
                    imageFeed.innerHTML = '';
                    
                    images.forEach(image => {
                        // Map database fields to the format expected by createImageItem
                        const displayImage = {
                            image_url: image.image_url,
                            src: image.image_url,
                            site_url: image.site_url,
                            link: image.site_url,
                            tags: image.tags,
                            alt: image.tags
                        };
                        targetElement.appendChild(createImageItem(displayImage));
                    });
                } else {
                    console.log('No images found in Supabase.');
                    // If we didn't already load from local storage, show placeholders
                    if (!localImages || localImages.length === 0) {
                        displayPlaceholderImages();
                    }
                }
            } catch (error) {
                console.error('Error populating image feed:', error);
                
                // Don't show alert for connection errors if we have local storage
                if (!localImages || localImages.length === 0) {
                    // Only show alert for non-connection errors
                    if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                        win98Alert('Error loading images: ' + error.message);
                    }
                    displayPlaceholderImages();
                }
            }
        } else {
            console.error('Supabase client not initialized.');
            // If we didn't already load from local storage, show placeholders
            if (!localImages || localImages.length === 0) {
                displayPlaceholderImages();
            }
        }
    }
    
    // Function to display placeholder images when Supabase fails
    function displayPlaceholderImages() {
        if (!imageFeed) return;
        
        console.log('Displaying placeholder images');
        
        // Clear any existing content
        imageFeed.innerHTML = '';
        
        // First try to load from local storage
        const localImages = loadFromLocalStorage();
        if (localImages && localImages.length > 0) {
            console.log('Using images from local storage');
            localImages.forEach(image => {
                imageFeed.appendChild(createImageItem(image));
            });
            return;
        }
        
        // If no local storage images, use placeholders
        const placeholderImages = [
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+1',
                link: '#',
                tags: 'placeholder, sample'
            },
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+2',
                link: '#',
                tags: 'placeholder, example'
            },
            {
                src: 'https://via.placeholder.com/300/c0c0c0/000000?text=Image+3',
                link: '#',
                tags: 'placeholder, demo'
            }
        ];
        
        placeholderImages.forEach(image => {
            imageFeed.appendChild(createImageItem(image));
        });
    }
    
    // Local storage fallback functions
    function saveToLocalStorage(image) {
        try {
            let images = loadFromLocalStorage() || [];
            images.unshift(image); // Add new image to the beginning
            localStorage.setItem('underweb_images', JSON.stringify(images));
            console.log('Saved image to local storage');
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const savedImages = localStorage.getItem('underweb_images');
            if (savedImages) {
                return JSON.parse(savedImages);
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
        }
        return null;
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
                try {
                    if (!supabaseClient) {
                        throw new Error('Supabase client not initialized');
                    }

                    // Create a unique file name
                    const timestamp = Date.now();
                    const fileExt = imageUpload.name.split('.').pop();
                    const fileName = `${timestamp}.${fileExt}`;
                    const filePath = `public/${fileName}`;

                    console.log('Uploading file:', fileName);

                    // Upload the file to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabaseClient
                        .storage
                        .from('images')
                        .upload(filePath, imageUpload, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: imageUpload.type
                        });

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        throw new Error(`Upload failed: ${uploadError.message}`);
                    }

                    console.log('Upload successful:', uploadData);

                    // Get the public URL
                    const { data: { publicUrl }, error: urlError } = supabaseClient
                        .storage
                        .from('images')
                        .getPublicUrl(filePath);

                    if (urlError) {
                        console.error('Error getting public URL:', urlError);
                        throw new Error(`Failed to get public URL: ${urlError.message}`);
                    }

                    submittedImageUrl = publicUrl;
                    console.log('Public URL:', submittedImageUrl);

                    // Create new image item
                    const newImage = {
                        src: submittedImageUrl,
                        link: siteLink,
                        tags: tagsInput
                    };

                    if (imageFeed) {
                        imageFeed.prepend(createImageItem(newImage));
                    }

                    // Save to database
                    const success = await saveImageToDatabase(newImage);
                    if (!success) {
                        console.warn('Image displayed but not saved to database');
                        saveToLocalStorage(newImage);
                    }

                    // Show messages
                    if (submissionMessage) {
                        submissionMessage.style.display = 'block';
                    }
                    if (embedInstructions) {
                        embedInstructions.style.display = 'block';
                    }

                    submitForm.reset();
                    win98Alert('Image submitted successfully!');
                } catch (error) {
                    console.error('Error handling file upload:', error);
                    win98Alert(error.message);
                }
            } else if (imageUrl) {
                submittedImageUrl = imageUrl;

                 // Create new image item and add to feed
                 const newImage = {
                    src: submittedImageUrl,
                    link: siteLink,
                    tags: tagsInput
                };
                imageFeed.prepend(createImageItem(newImage));

                // Save image to database
                saveImageToDatabase(newImage)
                    .then(success => {
                        if (!success) {
                            console.warn('Image displayed but not saved to database');
                            // Save to local storage as fallback
                            saveToLocalStorage(newImage);
                        }
                    });

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
            } else {
                win98Alert('Please upload an image or provide an image URL.');
                return; // Stop submission if no image provided
            }
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

    // Function to verify Supabase connection
    async function verifySupabaseConnection() {
        if (!supabaseClient) return false;
        
        try {
            // Try a simple query to verify the connection
            const { error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Supabase connection verification failed:', error);
                return false;
            }
            
            console.log('Supabase connection verified successfully');
            return true;
        } catch (error) {
            console.error('Error verifying Supabase connection:', error);
            return false;
        }
    }

    // Initialize Supabase client
    async function initSupabase() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase library not found');
            }

            console.log('Initializing Supabase client...');
            
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            
            // Create Supabase client
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Verify storage bucket exists and is accessible
            const { data: buckets, error: bucketsError } = await supabaseClient
                .storage
                .listBuckets();

            if (bucketsError) {
                throw new Error(`Storage error: ${bucketsError.message}`);
            }

            const imagesBucket = buckets.find(b => b.name === 'images');
            if (!imagesBucket) {
                console.log('Creating images bucket...');
                const { error: createError } = await supabaseClient
                    .storage
                    .createBucket('images', {
                        public: true,
                        allowedMimeTypes: ['image/*'],
                        fileSizeLimit: 5242880 // 5MB
                    });

                if (createError) {
                    throw new Error(`Failed to create bucket: ${createError.message}`);
                }
            }

            console.log('Supabase initialized successfully');
            return true;
            
            // Verify the connection works
            verifySupabaseConnection().then(isConnected => {
                if (!isConnected) {
                    console.warn('Using local storage fallback due to Supabase connection issues');
                    // Don't show an error alert to the user, just use placeholders
                    displayPlaceholderImages();
                }
            });
        } else {
            console.error('Supabase library not found');
            // Use placeholders when Supabase is not available
            displayPlaceholderImages();
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        // Use placeholders on initialization error
        displayPlaceholderImages();
    }
    
    // Initialize the page
    populateImageFeed();
    createWidget();
});
