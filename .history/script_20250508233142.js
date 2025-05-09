// @ts-check

/**
 * Main script for THE UNDERWEB application
 * This file handles the main functionality of the application including:
 * - Image feed population
 * - Form submissions
 * - Widget creation
 * - UI interactions
 */

/**
 * @typedef {Object} Folder
 * @property {string} name - The name of the folder
 */

/**
 * @typedef {Object} ImageItem
 * @property {string} src - The image source URL
 * @property {string} [image_url] - Alternative image source URL
 * @property {string} link - The link to the original site
 * @property {string} [site_url] - Alternative link to the original site
 * @property {string} tags - Image tags
 * @property {string} [alt] - Alternative text for the image
 * @property {number} [timestamp] - Timestamp for sorting
 */

/**
 * Initialize Supabase client globally
 * @type {any}
 */
let supabaseClient = null;

// Extend Window interface
/** @typedef {{ supabase?: { createClient(url: string, key: string): any }, UNDERWEB?: any }} SupabaseWindow */
/** @type {Window & typeof globalThis & SupabaseWindow} */
const win = window;

// Get configuration from common.js if available
const APP_CONFIG = win.UNDERWEB?.common?.APP_CONFIG || {
    STORAGE: {
        IMAGES_BUCKET: 'images',
        LOCAL_STORAGE_KEY: 'underweb_images'
    },
    API: {
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    UI: {
        AUTO_RESTORE_DELAY: 3000
    }
};

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
    const initSupabase = async () => {
        try {
            // Show loading indicator
            const loadingSpinner = createLoadingSpinner();
            document.body.appendChild(loadingSpinner);

            // First try to use the common.js implementation
            if (win.UNDERWEB?.common?.initSupabase) {
                console.log('Using common.js implementation for Supabase initialization');
                supabaseClient = await win.UNDERWEB.common.initSupabase();

                if (supabaseClient) {
                    console.log('Supabase initialized successfully with common.js');
                    document.body.removeChild(loadingSpinner);
                    return true;
                } else {
                    console.error('Failed to initialize Supabase client with common.js');
                    displayPlaceholderImages();
                    document.body.removeChild(loadingSpinner);
                    return false;
                }
            }
            // Fallback if common.js is not loaded or failed
            else {
                console.log('common.js not available, using direct Supabase initialization');

                // @ts-ignore
                if (!win.supabase) {
                    console.error('Supabase library not found');
                    displayPlaceholderImages();
                    document.body.removeChild(loadingSpinner);
                    return false;
                }

                // Use the same retry logic as in common.js
                let attempts = 0;
                const maxAttempts = APP_CONFIG.API.RETRY_ATTEMPTS;

                while (attempts < maxAttempts) {
                    attempts++;
                    try {
                        // Use hardcoded values as fallback
                        const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
                        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';

                        // @ts-ignore
                        supabaseClient = win.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                            auth: {
                                autoRefreshToken: true,
                                persistSession: true
                            }
                        });

                        // Verify the connection works
                        const { error } = await supabaseClient.auth.getSession();
                        if (error) {
                            console.warn(`Supabase connection attempt ${attempts} failed:`, error);
                            supabaseClient = null;

                            if (attempts < maxAttempts) {
                                // Wait before retrying with exponential backoff
                                const delay = APP_CONFIG.API.RETRY_DELAY * Math.pow(2, attempts - 1);
                                await new Promise(resolve => setTimeout(resolve, delay));
                            } else {
                                throw new Error('Failed to verify Supabase connection after multiple attempts');
                            }
                        } else {
                            // Connection successful
                            console.log('Supabase initialized successfully with direct initialization');
                            document.body.removeChild(loadingSpinner);
                            return true;
                        }
                    } catch (attemptError) {
                        console.warn(`Supabase initialization attempt ${attempts} failed:`, attemptError);

                        if (attempts < maxAttempts) {
                            // Wait before retrying with exponential backoff
                            const delay = APP_CONFIG.API.RETRY_DELAY * Math.pow(2, attempts - 1);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            document.body.removeChild(loadingSpinner);
                            throw attemptError;
                        }
                    }
                }

                // If we get here, all attempts failed
                document.body.removeChild(loadingSpinner);
                throw new Error('All Supabase initialization attempts failed');
            }
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            displayPlaceholderImages();
            return false;
        }
    }

    // Initialize and verify storage system
    const initializeStorage = async () => {
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
    const verifySupabaseConnection = async () => {
        if (!supabaseClient) {
            return false;
        }

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

    /**
     * Display a Windows 98 style alert using common.js if available
     * @param {string} message - The message to display
     */
    function win98Alert(message) {
        if (win.UNDERWEB?.common?.win98Alert) {
            win.UNDERWEB.common.win98Alert(message);
        } else {
            // Fallback if common.js is not loaded
            alert(message);
        }
    }

    /**
     * Create a loading spinner element
     * @param {string} [size='medium'] - Size of the spinner (small, medium, large)
     * @param {string} [color='#000080'] - Color of the spinner
     * @returns {HTMLElement} The spinner element
     */
    function createLoadingSpinner(size = 'medium', color = '#000080') {
        // Use common.js implementation if available
        if (win.UNDERWEB?.common?.createLoadingSpinner) {
            return win.UNDERWEB.common.createLoadingSpinner(size, color);
        }

        // Fallback implementation
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.position = 'fixed';
        spinner.style.top = '50%';
        spinner.style.left = '50%';
        spinner.style.transform = 'translate(-50%, -50%)';
        spinner.style.zIndex = '9999';

        // Set size based on parameter
        let pixelSize = '30px';
        if (size === 'small') {
            pixelSize = '20px';
        } else if (size === 'large') {
            pixelSize = '40px';
        }

        spinner.style.width = pixelSize;
        spinner.style.height = pixelSize;
        spinner.style.border = `4px solid rgba(0, 0, 0, 0.1)`;
        spinner.style.borderTopColor = color;
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 1s linear infinite';

        // Add the keyframes if they don't exist
        if (!document.getElementById('spinner-keyframes')) {
            const style = document.createElement('style');
            style.id = 'spinner-keyframes';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return spinner;
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
            // Validate URLs before saving
            /**
             * Validates if a string is a valid URL
             * @param {string} urlString - The URL string to validate
             * @returns {boolean} - True if valid URL, false otherwise
             */
            const isValidUrl = (urlString) => {
                try {
                    new URL(urlString);
                    return true;
                } catch (e) {
                    return false;
                }
            };

            if (!isValidUrl(imageData.src)) {
                console.error('Invalid image URL:', imageData.src);
                throw new Error('Invalid image URL format');
            }

            if (!isValidUrl(imageData.link)) {
                console.error('Invalid site URL:', imageData.link);
                throw new Error('Invalid site URL format');
            }

            // Convert the image data to match database schema
            const dbImageData = {
                image_url: imageData.src,
                site_url: imageData.link,
                tags: imageData.tags
            };

            console.log('Saving image to Supabase:', dbImageData);

            // Insert into Supabase with retry logic
            let attempts = 0;
            const maxAttempts = 3;
            let data, error;

            while (attempts < maxAttempts) {
                attempts++;
                console.log(`Database save attempt ${attempts} of ${maxAttempts}`);

                const result = await supabaseClient
                    .from('images')
                    .insert([dbImageData]);

                data = result.data;
                error = result.error;

                if (!error) break;

                if (attempts < maxAttempts) {
                    console.log(`Save failed, retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (error) {
                console.error('Error saving to Supabase after retries:', error);
                if (!error.message?.includes('API key') && !error.message?.includes('JWT')) {
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
                win98Alert('Warning: Image saved locally but failed to sync with server. Error: ' + errorMsg);
            }
            return true; // Still return true since we have local storage backup
        }
    }

    // Function to check if local storage is available
    function isLocalStorageAvailable() {
        // Use common.js implementation if available
        if (win.UNDERWEB?.common?.isLocalStorageAvailable) {
            return win.UNDERWEB.common.isLocalStorageAvailable();
        }

        // Fallback implementation
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

        // Show loading indicator
        const loadingSpinner = createLoadingSpinner('small');
        targetElement.appendChild(loadingSpinner);

        // Clear existing content while preserving header
        targetElement.innerHTML = submittedLinks ? '<h2>Submitted Links</h2>' : '';
        targetElement.appendChild(loadingSpinner);

        // Check if local storage is available
        if (!isLocalStorageAvailable()) {
            console.error('Local storage is not available');
            displayPlaceholderImages();
            targetElement.removeChild(loadingSpinner);
            return;
        }

        // Load from local storage first
        try {
            // Use common.js implementation if available
            let localImages;
            if (win.UNDERWEB?.common?.loadImagesFromLocalStorage) {
                localImages = win.UNDERWEB.common.loadImagesFromLocalStorage() || [];
            } else {
                localImages = loadFromLocalStorage() || [];
            }

            console.log('Loaded images from local storage:', localImages.length);

            if (localImages.length > 0) {
                console.log('Displaying local storage images:', localImages.length);
                localImages.forEach(image => {
                    const imageElement = createImageItem(image);
                    targetElement.appendChild(imageElement);
                });
            } else {
                console.log('No images found in local storage');
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
            displayPlaceholderImages();
            targetElement.removeChild(loadingSpinner);
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
                    localStorage.setItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY, JSON.stringify(formattedImages));

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
    /**
     * Save image to local storage
     * @param {any} image - The image object to save
     * @returns {boolean} - True if saved successfully
     */
    function saveToLocalStorage(image) {
        // Use common.js implementation if available
        if (win.UNDERWEB?.common?.saveImageToLocalStorage) {
            return win.UNDERWEB.common.saveImageToLocalStorage(image);
        }

        // Fallback implementation
        if (!isLocalStorageAvailable()) {
            console.error('Cannot save to local storage: storage not available');
            return false;
        }

        try {
            console.log('Attempting to save image to local storage:', image);
            let images = loadFromLocalStorage() || [];
            console.log('Current images in storage:', images.length);

            // Normalize image URLs for comparison
            /**
             * Normalizes a URL by removing the protocol
             * @param {string|undefined} url - The URL to normalize
             * @returns {string} - The normalized URL
             */
            const normalizeUrl = (url) => url?.replace(/^https?:\/\//, '') || '';
            const newImageUrl = normalizeUrl(image.src || image.image_url);

            // Check for duplicates based on normalized URL
            const isDuplicate = images.some((existing) => {
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
                    tags: image.tags || '',
                    alt: image.tags || 'Image',
                    timestamp: Date.now() // Add timestamp for sorting
                };

                images.unshift(formattedImage); // Add new image to the beginning
                localStorage.setItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY, JSON.stringify(images));
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

    /**
     * Load images from local storage
     * @returns {ImageItem[]|null} - Array of images or null if none found
     */
    function loadFromLocalStorage() {
        // Use common.js implementation if available
        if (win.UNDERWEB?.common?.loadImagesFromLocalStorage) {
            return win.UNDERWEB.common.loadImagesFromLocalStorage();
        }

        if (!isLocalStorageAvailable()) {
            console.error('Cannot load from local storage: storage not available');
            return null;
        }

        try {
            console.log('Loading images from local storage');
            const savedImages = localStorage.getItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY);

            if (savedImages) {
                const parsedImages = JSON.parse(savedImages);
                console.log('Successfully loaded images:', parsedImages.length);

                // Ensure all images have consistent properties and sort by timestamp
                return parsedImages
                    .map(image => ({
                        src: image.src || image.image_url || '',
                        image_url: image.src || image.image_url || '',
                        link: image.link || image.site_url || '',
                        site_url: image.link || image.site_url || '',
                        tags: image.tags || '',
                        alt: image.tags || 'Image',
                        timestamp: image.timestamp || Date.now()
                    }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by timestamp, newest first
            } else {
                console.log('No images found in local storage');
                return null;
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
            localStorage.removeItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY); // Clear corrupted data
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
                    // Show loading spinner
                    const loadingSpinner = document.getElementById('loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'block';
                    }

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
                        const imageData = {
                            src: newImage.src,
                            image_url: newImage.src,
                            link: newImage.link,
                            site_url: newImage.link,
                            tags: newImage.tags
                        };
                        imageFeed.prepend(createImageItem(imageData));
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
                } finally {
                    // Hide loading spinner
                    const loadingSpinner = document.getElementById('loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'none';
                    }
                }
            } else if (imageUrl) {
                submittedImageUrl = imageUrl;

                // Validate the image URL first
                /**
                 * Validates if an image URL is accessible
                 * @param {string} url - The URL to validate
                 * @returns {Promise<boolean>} - Promise that resolves to true if valid
                 */
                const validateImage = (url) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(true);
                        img.onerror = () => reject(new Error('Failed to load image. The image URL might be invalid or blocked by CORS policies.'));
                        img.src = url;
                    });
                };

                try {
                    // Show loading indicator
                    const loadingSpinner = document.getElementById('loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'block';
                    }

                    // Validate image URL
                    await validateImage(imageUrl);

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
                    try {
                        const success = await saveImageToDatabase(imageData);
                        console.log('Database save result:', success);
                        if (!success) {
                            console.warn('Image saved to local storage only');
                        }
                    } catch (error) {
                        console.error('Error saving to database:', error);
                    }

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
                } catch (error) {
                    console.error('Error with image URL submission:', error);
                    win98Alert(error instanceof Error ? error.message : 'Unknown error with image URL');
                } finally {
                    // Hide loading spinner
                    const loadingSpinner = document.getElementById('loading-spinner');
                    if (loadingSpinner) {
                        loadingSpinner.style.display = 'none';
                    }
                }
            } else {
                win98Alert('Please upload an image or provide an image URL.');
                return; // Stop submission if no image provided
            }
        });
    }

    // Copy embed code functionality
    if (copyEmbedButton && embedCodeTextarea) {
        copyEmbedButton.addEventListener('click', async () => {
            if (embedCodeTextarea instanceof HTMLTextAreaElement) {
                try {
                    // Use modern clipboard API if available
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(embedCodeTextarea.value);
                        win98Alert('Embed code copied to clipboard!');
                    } else {
                        // For non-secure contexts or older browsers
                        // Create a temporary textarea element for copying
                        const tempTextArea = document.createElement('textarea');
                        tempTextArea.value = embedCodeTextarea.value;

                        // Make it invisible but part of the document
                        tempTextArea.style.position = 'absolute';
                        tempTextArea.style.left = '-9999px';
                        document.body.appendChild(tempTextArea);

                        // Select and copy
                        tempTextArea.select();

                        try {
                            // Use the deprecated execCommand as a last resort
                            const successful = document.execCommand('copy');
                            if (successful) {
                                win98Alert('Embed code copied to clipboard!');
                            } else {
                                win98Alert('Unable to copy automatically. Please press Ctrl+C to copy.');
                            }
                        } catch (err) {
                            console.error('Copy failed:', err);
                            // Select the original textarea so user can copy manually
                            embedCodeTextarea.select();
                            win98Alert('Please press Ctrl+C to copy the embed code.');
                        } finally {
                            // Clean up
                            document.body.removeChild(tempTextArea);
                        }
                    }
                } catch (err) {
                    console.error('Copy failed:', err);
                    // Select the original textarea so user can copy manually
                    embedCodeTextarea.select();
                    win98Alert('Please press Ctrl+C to copy the embed code.');
                }
            }
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
                    }, APP_CONFIG.UI.AUTO_RESTORE_DELAY); // Auto-restore after delay
                }
            });
        }
    });

    // Initialize Supabase and start the app
    initSupabase().then(() => {
        populateImageFeed();
        createWidget();
    }).catch(error => {
        console.error('Failed to initialize application:', error);
        win98Alert('Failed to initialize application. Some features may not work properly.');
        // Still try to show content from local storage
        populateImageFeed();
    });
});

console.log('Supabase client:', supabaseClient);
// imageData is only defined within function scope, removing console log that could cause errors
