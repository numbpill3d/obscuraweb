// @ts-check

/**
 * Common utility functions and constants for THE UNDERWEB
 * This file centralizes configuration and shared utilities for the application
 */

// Extend Window interface to include our custom properties
// @ts-ignore
if (!window.UNDERWEB) {
    window.UNDERWEB = {};
}

/**
 * Application configuration
 * In a production environment, these values should be loaded from environment variables
 * or a configuration file that can be modified without changing the code.
 */
const APP_CONFIG = {
    // Application name and version
    APP_NAME: 'THE UNDERWEB',
    APP_VERSION: '1.0.0',

    // Supabase configuration
    SUPABASE: {
        URL: 'https://ibpnwppmlvlizuuxland.supabase.co',
        // This is a public anon key, but in a real production app, it should be handled more securely
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A'
    },

    // Storage configuration
    STORAGE: {
        IMAGES_BUCKET: 'images',
        LOCAL_STORAGE_KEY: 'underweb_images',
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },

    // API configuration
    API: {
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // ms
        TIMEOUT: 10000 // ms
    },

    // UI configuration
    UI: {
        THEME: 'win98',
        ANIMATION_SPEED: 300, // ms
        AUTO_RESTORE_DELAY: 3000 // ms for auto-restoring minimized windows
    }
};

/**
 * Initialize Supabase client with improved error handling and retry logic
 * @returns {Promise<any>} Supabase client or null if initialization fails
 */
async function initSupabase() {
    try {
        // Check if Supabase library is available
        // @ts-ignore
        if (!window.supabase) {
            console.error('Supabase library not found. Make sure to include the Supabase script in your HTML.');
            return null;
        }

        console.log('Initializing Supabase client...');

        // Create Supabase client with retry mechanism
        let attempts = 0;
        const maxAttempts = APP_CONFIG.API.RETRY_ATTEMPTS;
        let supabaseClient = null;

        while (attempts < maxAttempts && !supabaseClient) {
            attempts++;
            try {
                // @ts-ignore
                supabaseClient = window.supabase.createClient(
                    APP_CONFIG.SUPABASE.URL,
                    APP_CONFIG.SUPABASE.ANON_KEY,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true
                        }
                    }
                );

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
                        console.error('All Supabase connection attempts failed');
                        return null;
                    }
                }
            } catch (err) {
                console.warn(`Supabase initialization attempt ${attempts} failed:`, err);
                supabaseClient = null;

                if (attempts < maxAttempts) {
                    // Wait before retrying with exponential backoff
                    const delay = APP_CONFIG.API.RETRY_DELAY * Math.pow(2, attempts - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw err;
                }
            }
        }

        if (supabaseClient) {
            console.log('Supabase initialized successfully');

            // Initialize storage if needed
            try {
                await initializeStorage(supabaseClient);
            } catch (storageError) {
                console.warn('Storage initialization failed, but continuing with client:', storageError);
                // We'll continue even if storage init fails
            }

            return supabaseClient;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

/**
 * Initialize storage system for Supabase
 * @param {any} supabaseClient - The initialized Supabase client
 * @returns {Promise<boolean>} True if storage is initialized successfully
 */
async function initializeStorage(supabaseClient) {
    try {
        // Check if storage is available
        const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();

        if (bucketsError) {
            throw new Error(`Storage error: ${bucketsError.message}`);
        }

        // Find or create images bucket
        const imagesBucket = buckets.find((b) => b.name === APP_CONFIG.STORAGE.IMAGES_BUCKET);
        const bucketConfig = {
            public: true,
            allowedMimeTypes: APP_CONFIG.STORAGE.ALLOWED_MIME_TYPES,
            fileSizeLimit: APP_CONFIG.STORAGE.MAX_FILE_SIZE
        };

        if (!imagesBucket) {
            // Create the bucket if it doesn't exist
            const { error: createError } = await supabaseClient.storage.createBucket(
                APP_CONFIG.STORAGE.IMAGES_BUCKET,
                bucketConfig
            );

            if (createError) {
                throw new Error(`Failed to create storage bucket: ${createError.message}`);
            }

            console.log(`Created storage bucket: ${APP_CONFIG.STORAGE.IMAGES_BUCKET}`);
        } else {
            console.log(`Found existing storage bucket: ${APP_CONFIG.STORAGE.IMAGES_BUCKET}`);
        }

        return true;
    } catch (error) {
        console.error('Storage initialization error:', error);
        return false;
    }
}

/**
 * Windows 98 style alert function
 * @param {string} message - The message to display
 */
function win98Alert(message) {
    // Create alert container with modal overlay
    const alertContainer = document.createElement('div');
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '0';
    alertContainer.style.left = '0';
    alertContainer.style.width = '100%';
    alertContainer.style.height = '100%';
    alertContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    alertContainer.style.display = 'flex';
    alertContainer.style.justifyContent = 'center';
    alertContainer.style.alignItems = 'center';
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

/**
 * Windows 98 style confirm function
 * @param {string} message - The message to display
 * @param {Function} [onConfirm] - Callback function when user confirms
 * @param {Function} [onCancel] - Callback function when user cancels
 */
function win98Confirm(message, onConfirm, onCancel) {
    // Create confirm container with modal overlay
    const confirmContainer = document.createElement('div');
    confirmContainer.style.position = 'fixed';
    confirmContainer.style.top = '0';
    confirmContainer.style.left = '0';
    confirmContainer.style.width = '100%';
    confirmContainer.style.height = '100%';
    confirmContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    confirmContainer.style.display = 'flex';
    confirmContainer.style.justifyContent = 'center';
    confirmContainer.style.alignItems = 'center';
    confirmContainer.style.zIndex = '9999';

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

    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '10px';

    // Add Yes button
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes';
    yesButton.style.padding = '5px 20px';
    yesButton.style.border = '2px solid';
    yesButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    yesButton.style.backgroundColor = '#c0c0c0';
    yesButton.style.cursor = 'pointer';

    yesButton.addEventListener('click', () => {
        document.body.removeChild(confirmContainer);
        if (onConfirm) {
            onConfirm();
        }
    });

    // Add No button
    const noButton = document.createElement('button');
    noButton.textContent = 'No';
    noButton.style.padding = '5px 20px';
    noButton.style.border = '2px solid';
    noButton.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    noButton.style.backgroundColor = '#c0c0c0';
    noButton.style.cursor = 'pointer';

    noButton.addEventListener('click', () => {
        document.body.removeChild(confirmContainer);
        if (onCancel) {
            onCancel();
        }
    });

    // Assemble the confirm dialog
    buttonsContainer.appendChild(yesButton);
    buttonsContainer.appendChild(noButton);
    contentArea.appendChild(messageText);
    contentArea.appendChild(buttonsContainer);
    win98Box.appendChild(titleBar);
    win98Box.appendChild(contentArea);
    confirmContainer.appendChild(win98Box);

    // Add to body
    document.body.appendChild(confirmContainer);
}

/**
 * Show an error message using the win98Alert function
 * @param {string} message - The error message to display
 */
function showError(message) {
    win98Alert('Error: ' + message);
}

/**
 * Check if local storage is available and working
 * @returns {boolean} True if local storage is available
 */
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

/**
 * Load images from local storage
 * @returns {Array|null} Array of images or null if none found
 */
function loadImagesFromLocalStorage() {
    if (!isLocalStorageAvailable()) {
        return null;
    }

    try {
        const savedImages = localStorage.getItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY);

        if (savedImages) {
            const parsedImages = JSON.parse(savedImages);
            console.log('Successfully loaded images from local storage:', parsedImages.length);

            // Ensure all images have consistent properties and sort by timestamp
            const formattedImages = parsedImages
                .map(image => ({
                    src: image.src || image.image_url,
                    image_url: image.src || image.image_url,
                    link: image.link || image.site_url,
                    site_url: image.link || image.site_url,
                    tags: image.tags || '',
                    alt: image.tags || 'Image',
                    timestamp: image.timestamp || Date.now()
                }))
                .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first

            return formattedImages;
        }

        return null;
    } catch (error) {
        console.error('Error loading from local storage:', error);
        // Clear corrupted data
        localStorage.removeItem(APP_CONFIG.STORAGE.LOCAL_STORAGE_KEY);
        return null;
    }
}

/**
 * Save image to local storage
 * @param {Object} image - The image object to save
 * @returns {boolean} True if saved successfully
 */
function saveImageToLocalStorage(image) {
    if (!isLocalStorageAvailable()) {
        return false;
    }

    try {
        // Get existing images
        let images = loadImagesFromLocalStorage() || [];

        // Check for duplicates
        const isDuplicate = images.some(existingImage =>
            (existingImage.src === image.src || existingImage.image_url === image.image_url) &&
            (existingImage.link === image.link || existingImage.site_url === image.site_url)
        );

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
 * Create a loading spinner element
 * @param {string} [size='medium'] - Size of the spinner (small, medium, large)
 * @param {string} [color='#000080'] - Color of the spinner
 * @returns {HTMLElement} The spinner element
 */
function createLoadingSpinner(size = 'medium', color = '#000080') {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    // Set size based on parameter
    let pixelSize = '30px';
    if (size === 'small') pixelSize = '20px';
    if (size === 'large') pixelSize = '40px';

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

// Export functions and configuration for use in other files
// @ts-ignore
window.UNDERWEB = window.UNDERWEB || {};
// @ts-ignore
window.UNDERWEB.common = {
    // Configuration
    APP_CONFIG,

    // Core functions
    initSupabase,
    initializeStorage,

    // UI utilities
    win98Alert,
    win98Confirm,
    showError,
    createLoadingSpinner,

    // Storage utilities
    isLocalStorageAvailable,
    loadImagesFromLocalStorage,
    saveImageToLocalStorage
};
