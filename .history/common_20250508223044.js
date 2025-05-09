// @ts-check

/**
 * Common utility functions and constants for THE UNDERWEB
 */

// Extend Window interface to include our custom properties
// @ts-ignore
if (!window.UNDERWEB) {
    window.UNDERWEB = {};
}

/**
 * Supabase configuration
 * Note: In a production environment, these values should be stored in environment variables
 * and not committed to version control.
 */
const SUPABASE_CONFIG = {
    URL: 'https://ibpnwppmlvlizuuxland.supabase.co',
    // This is a public anon key, but in a real production app, it should be handled more securely
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A'
};

/**
 * Initialize Supabase client
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
        const maxAttempts = 3;
        let supabaseClient = null;

        while (attempts < maxAttempts && !supabaseClient) {
            attempts++;
            try {
                // @ts-ignore
                supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

                // Verify the connection works
                const { error } = await supabaseClient.auth.getSession();
                if (error) {
                    console.warn(`Supabase connection attempt ${attempts} failed:`, error);
                    supabaseClient = null;

                    if (attempts < maxAttempts) {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        console.error('All Supabase connection attempts failed');
                        return null;
                    }
                }
            } catch (err) {
                console.warn(`Supabase initialization attempt ${attempts} failed:`, err);
                supabaseClient = null;

                if (attempts < maxAttempts) {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw err;
                }
            }
        }

        if (supabaseClient) {
            console.log('Supabase initialized successfully');
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

// Export functions for use in other files
// @ts-ignore
window.UNDERWEB = window.UNDERWEB || {};
// @ts-ignore
window.UNDERWEB.common = {
    initSupabase,
    win98Alert,
    win98Confirm,
    showError,
    SUPABASE_CONFIG
};
