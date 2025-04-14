// @ts-nocheck

/**
 * Initialize Supabase client globally
 */
let supabaseClient = null;

// Extend Window interface
/** @typedef {{ supabase?: { createClient(url: string, key: string): SupabaseClient }}} SupabaseWindow */
/** @type {Window & typeof globalThis & SupabaseWindow} */
const win = window;

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
            if (!win.supabase) {
                throw new Error('Supabase library not found');
            }

            console.log('Initializing Supabase client...');
            
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            
            // Create Supabase client
            supabaseClient = win.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Initialize and verify storage system
            await initializeStorage();

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

    // Initialize and verify storage system
    async function initializeStorage() {
        try {
            // Check if storage is available
            const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();
            
            if (bucketsError) {
                throw new Error(`Storage error: ${bucketsError.message}`);
            }

            // Find or create images bucket
            /** @type {Bucket[]} */
            const typedBuckets = buckets;
            const imagesBucket = typedBuckets.find((b) => b.name === 'images');
            const bucketConfig = {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            };

            if (!imagesBucket) {
                console.log('Creating images bucket...');
                const { error: createError } = await supabaseClient
                    .storage
                    .createBucket('images', bucketConfig);

                if (createError) {
                    throw new Error(`Failed to create bucket: ${createError.message}`);
                }
            }

            // Ensure bucket configuration is up to date
            const { error: updateError } = await supabaseClient
                .storage
                .updateBucket('images', bucketConfig);

            if (updateError) {
                console.error('Error updating bucket:', updateError);
            }

            // Create uploads folder if it doesn't exist
            try {
                const { data: folders } = await supabaseClient
                    .storage
                    .from('images')
                    .list();

                /** @type {Folder[]} */
                const typedFolders = folders || [];
                const uploadsFolder = typedFolders.find((f) => f.name === 'uploads');
                if (!uploadsFolder) {
                    // Create an empty file to initialize the folder
                    const { error: folderError } = await supabaseClient
                        .storage
                        .from('images')
                        .upload('uploads/.keep', new Blob(['']));

                    if (folderError && !folderError.message.includes('already exists')) {
                        console.error('Error creating uploads folder:', folderError);
                    }
                }
            } catch (folderError) {
                console.error('Error checking/creating uploads folder:', folderError);
            }

            // Verify bucket access and permissions
            const { error: testError } = await supabaseClient
                .storage
                .from('images')
                .list('uploads');

            if (testError) {
                throw new Error(`Cannot access images bucket: ${testError.message}`);
            }

            console.log('Storage system initialized and verified');
            return true;
        } catch (error) {
            console.error('Storage initialization error:', error);
            throw error;
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
    /**
     * Display a Windows 98 style alert
     * @param {string} message - The message to display
     */
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
    /**
     * Create an image item element
     * @param {any} image - The image data
     * @returns {HTMLDivElement}
     */
    function createImageItem(image) {
        console.log('createImageItem called with image:', image);
        const item = document.createElement('div');
        item.classList.add('image-item');

        const img = document.createElement('img');
        // Handle both image.image_url (from Supabase) and image.src (from form submission)
        img.src = image.image_url || image.src || '';
        img.alt = image.alt || image.tags;

        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('tags');
        tagsDiv.textContent = image.tags;

        const link = document.createElement('a');
        // Handle both image.site_url (from Supabase) and image.link (from form submission)
        link.href = image.site_url || image.link || '#';
        link.target = '_blank'; // Open link in new tab
        link.appendChild(img);

        item.appendChild(link);
        item.appendChild(tagsDiv);

        return item;
    }

    // Function to save image data to Supabase database
    /**
     * Save image data to Supabase database
     * @param {ImageItem} imageData - The image data to save
     * @returns {Promise<boolean>}
     */
    async function saveImageToDatabase(imageData) {
        // Validate imageData
        if (!imageData || !imageData.src || !imageData.link || !imageData.tags) {
            console.error('Invalid image data:', imageData);
            return false;
        }

        // Always save to local storage first for immediate persistence
        saveToLocalStorage(imageData);

        if (!supabaseClient) {
            console.log('Supabase client not initialized, using local storage only');
            return true; // Return true since we saved to local storage
        }

        try {
            // Convert the image data to match database schema
            const dbImageData = {
                image_url: imageData.src,
                site_url: imageData.link,
                tags: imageData.tags
            };

            console.log('Saving image to Supabase:', dbImageData);

            // Insert into Supabase
            const { data, error } = await supabaseClient
                .from('images')
                .insert([dbImageData]);

            if (error) {
                console.error('Error saving to Supabase:', error);
                if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                    win98Alert('Warning: Image saved locally but failed to sync with server');
                }
                return true; // Still return true since we have local storage backup
            }

            console.log('Image saved to both local storage and Supabase:', data);
            return true;
        } catch (error) {
            console.error('Exception saving to Supabase:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            if (!errorMsg.includes('API key') && !errorMsg.includes('JWT')) {
                win98Alert('Warning: Image saved locally but failed to sync with server');
            }
            return true; // Still return true since we have local storage backup
        }
    }

    // Function to check if local storage is available
    function isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('Local storage not available:', e);
            return false;
        }
    }

    // Function to populate the image feed from both local storage and Supabase
    async function populateImageFeed() {
        console.log('populateImageFeed called');
        const targetElement = imageFeed || submittedLinks;
        if (!targetElement) {
            console.error('Target element not found');
            return;
        }

        // Clear existing content while preserving header
        targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : '';

        // Check if local storage is available
        if (!isLocalStorageAvailable()) {
            console.error('Local storage is not available');
            displayPlaceholderImages();
            return;
        }

        // Load from local storage first
        try {
            const localImages = loadFromLocalStorage() || [];
            console.log('Loaded images from local storage:', localImages);
            
            if (localImages.length > 0) {
                console.log('Displaying local storage images:', localImages.length);
                localImages.forEach(image => {
                    const imageElement = createImageItem(image);
                    targetElement.appendChild(imageElement);
                    console.log('Added image to feed:', image.src);
                });
            } else {
                console.log('No images found in local storage');
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
            displayPlaceholderImages();
            return;
        }

        // Then fetch from Supabase and update local storage
        if (supabaseClient) {
            try {
                console.log('Fetching images from Supabase database');
                const { data: images, error } = await supabaseClient
                    .from('images')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching images from Supabase:', error);
                    if (!error.message.includes('API key') && !error.message.includes('JWT')) {
                        win98Alert('Error syncing with server: ' + error.message);
                    }
                    return;
                }

                if (images && images.length > 0) {
                    // Update local storage with Supabase data
                    const formattedImages = images.map(image => ({
                        image_url: image.image_url,
                        src: image.image_url,
                        site_url: image.site_url,
                        link: image.site_url,
                        tags: image.tags,
                        alt: image.tags
                    }));

                    // Update local storage
                    localStorage.setItem('underweb_images', JSON.stringify(formattedImages));

                    // Update display only if Supabase has different data
                    const currentDisplay = Array.from(targetElement.children)
                        .filter(child => child.tagName !== 'H2')
                        .map(child => ({
                            src: child.querySelector('img')?.src,
                            link: child.querySelector('a')?.href,
                            tags: child.querySelector('.tags')?.textContent
                        }));

                    if (JSON.stringify(currentDisplay) !== JSON.stringify(formattedImages)) {
                        targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : '';
                        formattedImages.forEach(image => {
                            targetElement.appendChild(createImageItem(image));
                        });
                    }
                }
            } catch (error) {
                console.error('Error syncing with Supabase:', error);
                // Continue showing local storage data
            }
        }

        // Show placeholders only if no images available
        if (targetElement.children.length === 0 || 
            (targetElement.children.length === 1 && targetElement.children[0].tagName === 'H2')) {
            displayPlaceholderImages();
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
                src: 'data:image/svg+xml,%3Csvg width="300" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23c0c0c0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="%23000000" text-anchor="middle" dy=".3em"%3EImage 1%3C/text%3E%3C/svg%3E',
                link: '#',
                tags: 'placeholder, sample'
            },
            {
                src: 'data:image/svg+xml,%3Csvg width="300" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23c0c0c0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="%23000000" text-anchor="middle" dy=".3em"%3EImage 2%3C/text%3E%3C/svg%3E',
                link: '#',
                tags: 'placeholder, example'
            },
            {
                src: 'data:image/svg+xml,%3Csvg width="300" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23c0c0c0"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="%23000000" text-anchor="middle" dy=".3em"%3EImage 3%3C/text%3E%3C/svg%3E',
                link: '#',
                tags: 'placeholder, demo'
            }
        ];
        
        placeholderImages.forEach(image => {
            const imageData = {
                src: image.src,
                image_url: image.src,
                link: image.link,
                site_url: image.link,
                tags: image.tags
            };
            imageFeed.appendChild(createImageItem(imageData));
        });
    }
    
    // Enhanced local storage functions with better error handling and logging
    /**
     * @param {any} image
     */
    function saveToLocalStorage(image) {
        if (!isLocalStorageAvailable()) {
            console.error('Cannot save to local storage: storage not available');
            return false;
        }

        try {
            console.log('Attempting to save image to local storage:', image);
            let images = loadFromLocalStorage() || [];
            console.log('Current images in storage:', images.length);

            // Normalize image URLs for comparison
            const normalizeUrl = (url) => url?.replace(/^https?:\/\//, '');
            const newImageUrl = normalizeUrl(image.src || image.image_url);

            // Check for duplicates based on normalized URL
            const isDuplicate = images.some(existing => {
                const existingUrl = normalizeUrl(existing.src || existing.image_url);
                return existingUrl === newImageUrl;
            });

            if (!isDuplicate) {
                // Format the image data consistently
                const formattedImage = {
                    src: image.src || image.image_url,
                    image_url: image.src || image.image_url,
                    link: image.link || image.site_url,
                    site_url: image.link || image.site_url,
                    tags: image.tags,
                    alt: image.tags,
                    timestamp: Date.now() // Add timestamp for sorting
                };

                images.unshift(formattedImage); // Add new image to the beginning
                localStorage.setItem('underweb_images', JSON.stringify(images));
                console.log('Successfully saved new image to local storage:', formattedImage);
                return true;
            } else {
                console.log('Image already exists in local storage');
                return false;
            }
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    }
    
    function loadFromLocalStorage() {
        if (!isLocalStorageAvailable()) {
            console.error('Cannot load from local storage: storage not available');
            return null;
        }

        try {
            console.log('Loading images from local storage');
            const savedImages = localStorage.getItem('underweb_images');
            
            if (savedImages) {
                const parsedImages = JSON.parse(savedImages);
                console.log('Successfully loaded images:', parsedImages.length);
                
                // Ensure all images have consistent properties and sort by timestamp
                const formattedImages = parsedImages
                    .map(image => ({
                        src: image.src || image.image_url,
                        image_url: image.src || image.image_url,
                        link: image.link || image.site_url,
                        site_url: image.link || image.site_url,
                        tags: image.tags,
                        alt: image.tags,
                        timestamp: image.timestamp || Date.now()
                    }))
                    .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first

                console.log('Formatted and sorted images:', formattedImages);
                return formattedImages;
            } else {
                console.log('No images found in local storage');
                return null;
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
            localStorage.removeItem('underweb_images'); // Clear corrupted data
            return null;
        }
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

            const imageUploadEl = document.getElementById('image-upload');
            const imageUrlEl = document.getElementById('image-url');
            const siteLinkEl = document.getElementById('site-link');
            const tagsInputEl = document.getElementById('tags');

            if (!(imageUploadEl instanceof HTMLInputElement) ||
                !(imageUrlEl instanceof HTMLInputElement) ||
                !(siteLinkEl instanceof HTMLInputElement) ||
                !(tagsInputEl instanceof HTMLInputElement)) {
                throw new Error('Required form elements not found');
            }

            const imageUpload = imageUploadEl.files?.[0];
            const imageUrl = imageUrlEl.value;
            const siteLink = siteLinkEl.value;
            const tagsInput = tagsInputEl.value;

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
                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (!allowedTypes.includes(imageUpload.type)) {
                        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
                    }

                    // Validate file size (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                    if (imageUpload.size > maxSize) {
                        throw new Error('File size too large. Maximum size is 5MB.');
                    }

                    // Prepare file path and metadata
                    const filePath = `uploads/${fileName}`; // Store in uploads subfolder
                    const fileMetadata = {
                        contentType: imageUpload.type,
                        size: imageUpload.size,
                        lastModified: imageUpload.lastModified
                    };

                    console.log('Preparing upload:', {
                        path: filePath,
                        type: imageUpload.type,
                        size: imageUpload.size,
                        metadata: fileMetadata
                    });

                    // Ensure the uploads folder exists
                    const { error: folderError } = await supabaseClient
                        .storage
                        .from('images')
                        .list('uploads');

                    if (folderError) {
                        console.log('Creating uploads folder...');
                        await supabaseClient
                            .storage
                            .from('images')
                            .upload('uploads/.keep', new Blob(['']));
                    }

                    // Check if file already exists
                    const { data: existingFile } = await supabaseClient
                        .storage
                        .from('images')
                        .list('uploads', {
                            search: fileName
                        });

                    if (existingFile?.length > 0) {
                        console.log('File exists, will be overwritten');
                        // Remove existing file first to avoid conflicts
                        await supabaseClient
                            .storage
                            .from('images')
                            .remove([filePath]);
                    }

                    // Upload with enhanced error handling and retry logic
                    let uploadAttempt = 0;
                    const maxAttempts = 3;
                    let uploadData, uploadError;

                    while (uploadAttempt < maxAttempts) {
                        uploadAttempt++;
                        console.log(`Upload attempt ${uploadAttempt} of ${maxAttempts}`);

                        const result = await supabaseClient
                            .storage
                            .from('images')
                            .upload(filePath, imageUpload, {
                                cacheControl: '3600',
                                upsert: true,
                                contentType: imageUpload.type
                            });

                        uploadData = result.data;
                        uploadError = result.error;

                        if (!uploadError) break;

                        if (uploadAttempt < maxAttempts) {
                            console.log(`Upload failed, retrying in 1 second...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }

                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        throw new Error(`Upload failed: ${uploadError.message}`);
                    }

                    console.log('Upload successful:', uploadData);

                    // Get the public URL with improved error handling
                    let publicUrl;
                    try {
                        const { data: urlData } = await supabaseClient
                            .storage
                            .from('images')
                            .getPublicUrl(filePath);
                        
                        if (!urlData || !urlData.publicUrl) {
                            throw new Error('Failed to get public URL for uploaded image');
                        }
                        
                        publicUrl = urlData.publicUrl;
                        console.log('Generated public URL:', publicUrl);
                    } catch (urlError) {
                        console.error('Error getting public URL:', urlError);
                        throw new Error(`Failed to get public URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
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
                        if (imageFeed) {
                            const imageData = {
                                src: newImage.src,
                                image_url: newImage.src,
                                link: newImage.link,
                                site_url: newImage.link,
                                tags: newImage.tags
                            };
                            imageFeed.prepend(createImageItem(imageData));
                        }
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

                    if (submitForm instanceof HTMLFormElement) {
                        submitForm.reset();
                    }
                    win98Alert('Image submitted successfully!');
                } catch (error) {
                    console.error('Error handling file upload:', error);
                    win98Alert(error instanceof Error ? error.message : 'Unknown error');
                }
            } else if (imageUrl) {
                submittedImageUrl = imageUrl;

                 // Create new image item and add to feed
                 const newImage = {
                    src: submittedImageUrl,
                    link: siteLink,
                    tags: tagsInput
                };
                // Format the image data
                const imageData = {
                    src: newImage.src,
                    image_url: newImage.src,
                    link: newImage.link,
                    site_url: newImage.link,
                    tags: newImage.tags
                };

                // Save to local storage first
                saveToLocalStorage(imageData);
                console.log('Saved to local storage:', imageData);

                // Update display
                if (imageFeed) {
                    imageFeed.prepend(createImageItem(imageData));
                    console.log('Added image to feed:', imageData);
                }

                // Save to database
                saveImageToDatabase(imageData)
                    .then(success => {
                        console.log('Database save result:', success);
                        if (!success) {
                            console.warn('Image saved to local storage only');
                        }
                    })
                    .catch(error => {
                        console.error('Error saving to database:', error);
                    });

                // Show success messages
                if (submissionMessage) {
                    submissionMessage.style.display = 'block';
                }
                if (embedInstructions) {
                    embedInstructions.style.display = 'block';
                }

                // Reset form and show success message
                if (submitForm instanceof HTMLFormElement) {
                    submitForm.reset();
                }
                win98Alert('Image submitted successfully!');

                // Refresh the image feed to ensure it's up to date
                setTimeout(() => {
                    populateImageFeed();
                }, 500);
            } else {
                win98Alert('Please upload an image or provide an image URL.');
                return; // Stop submission if no image provided
            }
        });
    }

    // Copy embed code functionality
    if (copyEmbedButton && embedCodeTextarea) {
        copyEmbedButton.addEventListener('click', () => {
            if (embedCodeTextarea instanceof HTMLTextAreaElement) {
                embedCodeTextarea.select();
            }
            document.execCommand('copy');
            win98Alert('Embed code copied to clipboard!'); // Windows 98 style alert
        });
    }

    // Add click handlers to window title bar X buttons
    document.querySelectorAll('.win98-box-title span:last-child').forEach(closeButton => {
        if (closeButton instanceof HTMLElement) {
            closeButton.style.cursor = 'pointer';
            closeButton.addEventListener('click', function() {
                const parentBox = this.closest('.win98-box');
                if (parentBox && parentBox instanceof HTMLElement) {
                    parentBox.style.display = 'none';

                    // Show a "restore" button somewhere
                    setTimeout(() => {
                        if (parentBox instanceof HTMLElement) {
                            parentBox.style.display = 'block';
                        }
                    }, 3000); // Auto-restore after 3 seconds for demo purposes
                }
            });
        }
    });

    // Initialize Supabase and start the app
    initSupabase().then(() => {
        populateImageFeed();
        createWidget();
    });
});

console.log('Supabase client:', supabaseClient);
console.log('Image data:', imageData);
