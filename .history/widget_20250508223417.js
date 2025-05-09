// @ts-check
/**
 * @typedef {Object} WidgetImage
 * @property {string} src - The image source URL
 * @property {string} link - The link to the original site
 * @property {string} tags - Image tags
 */

(async function () {
    // Extend Window interface
    /** @typedef {{
     *   supabase?: { createClient(url: string, key: string): any },
     *   UNDERWEB?: {
     *     common?: {
     *       SUPABASE_CONFIG?: { URL: string, ANON_KEY: string }
     *     }
     *   }
     * }} SupabaseWindow */
    /** @type {Window & typeof globalThis & SupabaseWindow} */
    const win = window;
    // Helper function for alerts
    /**
     * @param {string} message - The message to display
     */
    const win98Alert = (message) => {
        console.warn("[UNDERWEB WIDGET] " + message);
        // Since this is a widget on another site, we won't show actual alerts to avoid disrupting the host site
    };

    // Initialize Supabase client
    /** @type {any} */
    let supabaseClient = null;

    /** @type {WidgetImage[]} */
    let images = [
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W1', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W2', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W3', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W4', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W5', link: '#', tags: 'placeholder' }
    ];

    // Attempt to fetch images from Supabase with retry logic
    async function fetchImagesWithRetry() {
        // @ts-ignore
        if (!window.supabase) {
            console.warn('Supabase library not found. Widget will display placeholder images only.');
            return null;
        }

        console.log('Initializing Supabase client for widget...');

        try {
            // Use common.js configuration if available
            // @ts-ignore
            const SUPABASE_URL = window.UNDERWEB && window.UNDERWEB.common && window.UNDERWEB.common.SUPABASE_CONFIG
                // @ts-ignore
                ? window.UNDERWEB.common.SUPABASE_CONFIG.URL
                : 'https://ibpnwppmlvlizuuxland.supabase.co';

            // @ts-ignore
            const SUPABASE_ANON_KEY = window.UNDERWEB && window.UNDERWEB.common && window.UNDERWEB.common.SUPABASE_CONFIG
                // @ts-ignore
                ? window.UNDERWEB.common.SUPABASE_CONFIG.ANON_KEY
                : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';

            // Create Supabase client with retry mechanism
            let attempts = 0;
            const maxAttempts = 3;
            let fetchedImages = null;

            while (attempts < maxAttempts && !fetchedImages) {
                attempts++;
                try {
                    // @ts-ignore
                    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                    // Fetch images from Supabase
                    const { data, error } = await supabaseClient
                        .from('images')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (error) {
                        console.warn(`Error fetching images for widget (attempt ${attempts}):`, error);

                        if (attempts < maxAttempts) {
                            // Wait before retrying
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            console.error('Failed to fetch images after multiple attempts');
                            return null;
                        }
                    } else if (data && Array.isArray(data) && data.length > 0) {
                        fetchedImages = data;
                        return fetchedImages;
                    } else {
                        console.warn('Fetched images are invalid or empty');
                        return null;
                    }
                } catch (err) {
                    console.warn(`Error in Supabase fetch attempt ${attempts}:`, err);

                    if (attempts < maxAttempts) {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        throw err;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error initializing Supabase for widget:', error);
            return null;
        }
    }

    try {
        // Try to fetch images from Supabase
        const fetchedImages = await fetchImagesWithRetry();

        if (fetchedImages && Array.isArray(fetchedImages) && fetchedImages.length > 0) {
            // Map the fetched images to our widget format
            images = fetchedImages.map(img => ({
                src: img.image_url || '',
                link: img.site_url || '#',
                tags: img.tags || 'No tags'
            }));
            console.log('Successfully fetched images for widget:', images.length);
        } else {
            console.warn('Using placeholder images for widget');
        }
    } catch (error) {
        console.error('Error setting up widget:', error);
        win98Alert('An unexpected error occurred. Displaying placeholders.');
    }

    /**
     * Create a widget strip and add it to the container
     * @param {HTMLElement} container - The container element to add the widget to
     */
    const createWidgetStrip = (container) => {
        // Create Windows 98 style container
        const win98Box = document.createElement('div');
        win98Box.className = 'win98-box';
        win98Box.style.margin = '10px 0';

        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'win98-box-title';
        titleBar.innerHTML = '<span>THE UNDERWEB Widget</span><span>X</span>';

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'win98-box-content';

        // Create widget strip
        const widgetStrip = document.createElement('div');
        widgetStrip.id = 'widget-strip';
        widgetStrip.className = 'widget-strip';

        // Display a subset of random images in the widget
        const shuffledImages = [...images].sort(() => 0.5 - Math.random());
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length));

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.src;
            widgetImage.alt = image.tags || 'THE UNDERWEB';
            widgetImage.className = 'widget-image';
            widgetImage.title = image.tags || ''; // Show tags on hover
            widgetImage.addEventListener('click', () => {
                window.open(image.link, '_blank');
            });
            widgetStrip.appendChild(widgetImage);
        });

        // Add credit text
        const creditText = document.createElement('div');
        creditText.className = 'widget-credit';
        creditText.innerHTML = '<a href="' + window.location.origin + '" target="_blank">THE UNDERWEB</a> - Explore the hidden web';

        // Assemble the widget
        contentArea.appendChild(widgetStrip);
        contentArea.appendChild(creditText);
        win98Box.appendChild(titleBar);
        win98Box.appendChild(contentArea);
        container.appendChild(win98Box);
    }

    const widgetContainers = document.querySelectorAll('#underweb-widget');
    if (widgetContainers.length === 0) {
        console.warn('No widget containers found. Ensure #underweb-widget exists in the DOM.');
        return;
    }

    widgetContainers.forEach(container => {
        if (container instanceof HTMLElement) {
            createWidgetStrip(container);
        }
    });

    // Notify that widget has loaded successfully
    console.log("[UNDERWEB WIDGET] Successfully loaded widget");
})();
