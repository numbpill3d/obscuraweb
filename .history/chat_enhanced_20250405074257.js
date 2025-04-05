document.addEventListener('DOMContentLoaded', () => {
    // DOM elements - Main UI
    const threadListElement = document.getElementById('thread-list');
    const threadFormElement = document.getElementById('thread-form');
    const postListElement = document.getElementById('post-list');
    const postFormElement = document.getElementById('post-form');
    const threadTitleElement = document.getElementById('thread-title');
    const backToThreadsButton = document.getElementById('back-to-threads');
    const threadViewElement = document.getElementById('thread-view');
    const threadsViewElement = document.getElementById('threads-view');
    const categoryFilterElement = document.getElementById('category-filter');
    
    // DOM elements - User Authentication
    const loginFormElement = document.getElementById('login-form');
    const registerFormElement = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    const userProfileElement = document.getElementById('user-profile');
    const editProfileFormElement = document.getElementById('edit-profile-form');
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    
    // DOM elements - Admin/Moderation
    const adminPanelElement = document.getElementById('admin-panel');
    const moderationLogElement = document.getElementById('moderation-log');
    const categoryManagementElement = document.getElementById('category-management');
    const userManagementElement = document.getElementById('user-management');
    
    // State
    let currentUser = null;
    let currentThreadId = null;
    let currentCategoryId = null;
    let categories = [];
    let isEditingPost = false;
    let editingPostId = null;
    
    // Initialize Supabase client if available
    let supabaseClient = null;
    try {
        if (window.supabase) {
            console.log('Supabase library found, initializing client');
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Check for existing session
            checkSession();
        } else {
            console.error('Supabase library not found');
            showError('Supabase library not found. Forum functionality will be limited to demo mode.');
            
            // In demo mode, set a mock user
            setDemoUser();
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        showError('Error initializing forum. Please try again later.');
        
        // In case of error, set a mock user for demo mode
        setDemoUser();
    }
    
    // Set a demo user for testing when Supabase is not available
    function setDemoUser() {
        currentUser = {
            id: 'demo-user-id',
            username: 'DemoUser',
            email: 'demo@example.com',
            display_name: 'Demo User',
            is_admin: true,
            is_moderator: true
        };
        updateAuthUI();
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
    
    // Windows 98 style confirm function
    function win98Confirm(message, onConfirm, onCancel) {
        // Create confirm container
        const confirmContainer = document.createElement('div');
        confirmContainer.style.position = 'fixed';
        confirmContainer.style.top = '50%';
        confirmContainer.style.left = '50%';
        confirmContainer.style.transform = 'translate(-50%, -50%)';
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
            if (onConfirm) onConfirm();
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
            if (onCancel) onCancel();
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
    
    function showError(message) {
        win98Alert('Error: ' + message);
    }
    
    // Authentication functions
