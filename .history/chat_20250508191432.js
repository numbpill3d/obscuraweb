// @ts-check

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} [display_name] - Display name
 * @property {boolean} [is_admin] - Whether the user is an admin
 * @property {boolean} [is_moderator] - Whether the user is a moderator
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Category ID
 * @property {string} name - Category name
 * @property {string} description - Category description
 */

/**
 * @typedef {Object} Thread
 * @property {string} id - Thread ID
 * @property {string} title - Thread title
 * @property {string} category_id - Category ID
 * @property {string} user_id - User ID
 * @property {string} created_at - Creation timestamp
 * @property {number} [post_count] - Number of posts in the thread
 * @property {Object} [users] - User who created the thread
 * @property {Object} [categories] - Category of the thread
 */

/**
 * @typedef {Object} Post
 * @property {string} id - Post ID
 * @property {string} content - Post content
 * @property {string} user_id - User ID
 * @property {string} created_at - Creation timestamp
 * @property {Object} [users] - User who created the post
 */

/**
 * Show an error message using the win98Alert function
 * @param {string} message - The error message to display
 */
const showError = (message) => {
    if (win.UNDERWEB && win.UNDERWEB.common && win.UNDERWEB.common.showError) {
        win.UNDERWEB.common.showError(message);
    } else {
        win98Alert('Error: ' + message);
    }
};

/**
 * Windows 98 style alert function
 * @param {string} message - The message to display
 */
const win98Alert = (message) => {
    if (win.UNDERWEB && win.UNDERWEB.common && win.UNDERWEB.common.win98Alert) {
        win.UNDERWEB.common.win98Alert(message);
    } else {
        // Fallback if common.js is not loaded
        alert(message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements - Main UI
    /** @type {HTMLElement | null} */
    const threadListElement = document.getElementById('thread-list');
    /** @type {HTMLElement | null} */
    const threadFormElement = document.getElementById('thread-form');
    /** @type {HTMLElement | null} */
    const postListElement = document.getElementById('post-list');
    /** @type {HTMLElement | null} */
    const postFormElement = document.getElementById('post-form');
    /** @type {HTMLElement | null} */
    const threadTitleElement = document.getElementById('thread-title');
    /** @type {HTMLElement | null} */
    const backToThreadsButton = document.getElementById('back-to-threads');
    /** @type {HTMLElement | null} */
    const threadViewElement = document.getElementById('thread-view');
    /** @type {HTMLElement | null} */
    const threadsViewElement = document.getElementById('threads-view');
    /** @type {HTMLSelectElement | null} */
    const categoryFilterElement = document.getElementById('category-filter');

    // DOM elements - User Authentication
    /** @type {HTMLElement | null} */
    const loginFormElement = document.getElementById('login-form');
    /** @type {HTMLElement | null} */
    const registerFormElement = document.getElementById('register-form');
    /** @type {HTMLElement | null} */
    const logoutButton = document.getElementById('logout-button');
    /** @type {HTMLElement | null} */
    const userProfileElement = document.getElementById('user-profile');
    /** @type {HTMLElement | null} */
    const editProfileFormElement = document.getElementById('edit-profile-form');
    /** @type {HTMLElement | null} */
    const authSection = document.getElementById('auth-section');
    /** @type {HTMLElement | null} */
    const userSection = document.getElementById('user-section');

    // DOM elements - Admin/Moderation
    /** @type {HTMLElement | null} */
    const adminPanelElement = document.getElementById('admin-panel');
    /** @type {HTMLElement | null} */
    const moderationLogElement = document.getElementById('moderation-log');
    /** @type {HTMLElement | null} */
    const categoryManagementElement = document.getElementById('category-management');
    /** @type {HTMLElement | null} */
    const userManagementElement = document.getElementById('user-management');

    // State
    /** @type {User | null} */
    let currentUser = null;
    /** @type {string | null} */
    let currentThreadId = null;
    /** @type {string | null} */
    let currentCategoryId = null;
    /** @type {Category[]} */
    let categories = [];
    /** @type {boolean} */
    let isEditingPost = false;
    /** @type {string | null} */
    let editingPostId = null;

    /**
     * @typedef {{
     *   supabase?: { createClient(url: string, key: string): any },
     *   UNDERWEB?: {
     *     common?: {
     *       win98Alert: (message: string) => void,
     *       win98Confirm: (message: string, onConfirm?: Function, onCancel?: Function) => void,
     *       showError: (message: string) => void
     *     }
     *   }
     * }} SupabaseWindow
     */

    /**
     * @type {Window & typeof globalThis & SupabaseWindow}
     */
    const win = window;

    // Initialize Supabase client if available
    /** @type {any} */
    let supabaseClient = null;
    try {
        if (win.supabase) {
            console.log('Supabase library found, initializing client');
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            supabaseClient = win.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    /**
     * Set a demo user for testing when Supabase is not available
     */
    const setDemoUser = () => {
        /** @type {User} */
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

    // Using the win98Alert function defined at the top of the file

    /**
     * Windows 98 style confirm function
     * @param {string} message - The message to display
     * @param {Function} [onConfirm] - Callback function when user confirms
     * @param {Function} [onCancel] - Callback function when user cancels
     */
    const win98Confirm = (message, onConfirm, onCancel) => {
        if (win.UNDERWEB && win.UNDERWEB.common && win.UNDERWEB.common.win98Confirm) {
            win.UNDERWEB.common.win98Confirm(message, onConfirm, onCancel);
        } else {
            // Fallback if common.js is not loaded
            if (confirm(message)) {
                if (onConfirm) onConfirm();
            } else {
                if (onCancel) onCancel();
            }
        }
    }

    /**
     * Show an error message using the win98Alert function
     * @param {string} message - The error message to display
     */
    const showError = (message) => {
        if (win.UNDERWEB && win.UNDERWEB.common && win.UNDERWEB.common.showError) {
            win.UNDERWEB.common.showError(message);
        } else {
            win98Alert('Error: ' + message);
        }
    }

    // Authentication functions

    // Check for existing session
    async function checkSession() {
        if (!supabaseClient) return;

        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('Error checking session:', error);
                return;
            }

            if (session) {
                // Get user profile
                const { data: userData, error: userError } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user profile:', userError);
                    return;
                }

                currentUser = userData;
                updateAuthUI();
            }
        } catch (error) {
            console.error('Error in checkSession:', error);
        }
    }

    // Update UI based on authentication state
    function updateAuthUI() {
        if (currentUser) {
            // User is logged in
            if (authSection) authSection.style.display = 'none';
            if (userSection) {
                userSection.style.display = 'block';
                const userNameElement = userSection.querySelector('.username');
                if (userNameElement) {
                    userNameElement.textContent = currentUser.display_name || currentUser.username;
                }
            }

            // Show admin panel if user is admin
            if (adminPanelElement) {
                adminPanelElement.style.display = currentUser.is_admin ? 'block' : 'none';
            }

            // Update thread and post forms with user info
            if (threadFormElement) {
                threadFormElement.style.display = 'block';
            }

            if (postFormElement) {
                postFormElement.style.display = 'block';
            }

            // Load threads and categories
            loadCategories();
            loadThreads();
        } else {
            // User is not logged in
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (adminPanelElement) adminPanelElement.style.display = 'none';

            // Hide thread and post forms
            if (threadFormElement) {
                threadFormElement.style.display = 'none';
            }

            if (postFormElement) {
                postFormElement.style.display = 'none';
            }

            // Still load threads for read-only access
            loadCategories();
            loadThreads();
        }
    }

    // Load categories
    async function loadCategories() {
        // In demo mode, use placeholder categories
        if (!supabaseClient) {
            categories = [
                { id: 'general', name: 'General Discussion', description: 'General topics' },
                { id: 'tech', name: 'Technology', description: 'Tech discussions' },
                { id: 'art', name: 'Digital Art', description: 'Art and creativity' },
                { id: 'retro', name: 'Retro Web', description: 'Old-school web topics' }
            ];

            if (categoryFilterElement) {
                categoryFilterElement.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilterElement.appendChild(option);
                });
            }
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error loading categories:', error);
                return;
            }

            categories = data || [];

            if (categoryFilterElement) {
                categoryFilterElement.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilterElement.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error in loadCategories:', error);
        }
    }

    // Load threads
    async function loadThreads() {
        if (!threadListElement) return;

        // Clear existing threads
        threadListElement.innerHTML = '<h3>Forum Threads</h3>';

        // In demo mode, use placeholder threads
        if (!supabaseClient) {
            const demoThreads = [
                { id: 'thread1', title: 'Welcome to THE UNDERWEB', category_id: 'general', user_id: 'demo-user-id', created_at: new Date().toISOString(), post_count: 5 },
                { id: 'thread2', title: 'Retro Web Design Tips', category_id: 'retro', user_id: 'demo-user-id', created_at: new Date().toISOString(), post_count: 3 },
                { id: 'thread3', title: 'Digital Art Showcase', category_id: 'art', user_id: 'demo-user-id', created_at: new Date().toISOString(), post_count: 7 }
            ];

            demoThreads.forEach(thread => {
                const threadItem = createThreadItem(thread);
                threadListElement.appendChild(threadItem);
            });
            return;
        }

        try {
            let query = supabaseClient
                .from('threads')
                .select('*, users(username, display_name), categories(name)')
                .order('created_at', { ascending: false });

            if (currentCategoryId) {
                query = query.eq('category_id', currentCategoryId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error loading threads:', error);
                return;
            }

            if (data && data.length > 0) {
                data.forEach(thread => {
                    const threadItem = createThreadItem(thread);
                    threadListElement.appendChild(threadItem);
                });
            } else {
                const noThreadsMessage = document.createElement('p');
                noThreadsMessage.textContent = 'No threads found. Be the first to create one!';
                threadListElement.appendChild(noThreadsMessage);
            }
        } catch (error) {
            console.error('Error in loadThreads:', error);
        }
    }

    // Create thread item element
    function createThreadItem(thread) {
        const threadItem = document.createElement('div');
        threadItem.classList.add('thread-item', 'win98-box');

        const threadTitle = document.createElement('div');
        threadTitle.classList.add('win98-box-title');
        threadTitle.innerHTML = `<span>${thread.title}</span>`;

        const threadContent = document.createElement('div');
        threadContent.classList.add('win98-box-content');

        const threadInfo = document.createElement('div');
        threadInfo.classList.add('thread-info');

        // Get category name
        let categoryName = 'Unknown';
        if (thread.categories && thread.categories.name) {
            categoryName = thread.categories.name;
        } else if (thread.category_id) {
            const category = categories.find(c => c.id === thread.category_id);
            if (category) categoryName = category.name;
        }

        // Get author name
        let authorName = 'Unknown';
        if (thread.users && (thread.users.display_name || thread.users.username)) {
            authorName = thread.users.display_name || thread.users.username;
        } else if (thread.user_id === 'demo-user-id') {
            authorName = 'Demo User';
        }

        // Format date
        const createdDate = new Date(thread.created_at).toLocaleDateString();

        threadInfo.innerHTML = `
            <div>Category: <span class="category-tag">${categoryName}</span></div>
            <div>By: <span class="author">${authorName}</span></div>
            <div>Created: <span class="date">${createdDate}</span></div>
            <div>Posts: <span class="post-count">${thread.post_count || 0}</span></div>
        `;

        threadContent.appendChild(threadInfo);

        // Add view button
        const viewButton = document.createElement('button');
        viewButton.textContent = 'View Thread';
        viewButton.addEventListener('click', () => {
            viewThread(thread.id, thread.title);
        });

        threadContent.appendChild(viewButton);
        threadItem.appendChild(threadTitle);
        threadItem.appendChild(threadContent);

        return threadItem;
    }

    // View thread function
    function viewThread(threadId, threadTitle) {
        currentThreadId = threadId;

        if (threadTitleElement) {
            threadTitleElement.textContent = threadTitle;
        }

        if (threadsViewElement) {
            threadsViewElement.style.display = 'none';
        }

        if (threadViewElement) {
            threadViewElement.style.display = 'block';
        }

        loadPosts(threadId);
    }

    // Load posts for a thread
    async function loadPosts(threadId) {
        if (!postListElement) return;

        // Clear existing posts
        postListElement.innerHTML = '';

        // In demo mode, use placeholder posts
        if (!supabaseClient) {
            const demoPosts = [
                { id: 'post1', content: 'Welcome to THE UNDERWEB forum! This is a place to discuss all things related to the hidden corners of the internet.', user_id: 'demo-user-id', created_at: new Date().toISOString() },
                { id: 'post2', content: 'Thanks for creating this space! I\'ve been looking for a community like this.', user_id: 'other-user', created_at: new Date().toISOString() },
                { id: 'post3', content: 'Feel free to share your favorite obscure websites and digital art projects here.', user_id: 'demo-user-id', created_at: new Date().toISOString() }
            ];

            demoPosts.forEach(post => {
                const postItem = createPostItem(post);
                postListElement.appendChild(postItem);
            });
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*, users(username, display_name)')
                .eq('thread_id', threadId)
                .order('created_at');

            if (error) {
                console.error('Error loading posts:', error);
                return;
            }

            if (data && data.length > 0) {
                data.forEach(post => {
                    const postItem = createPostItem(post);
                    postListElement.appendChild(postItem);
                });
            } else {
                const noPostsMessage = document.createElement('p');
                noPostsMessage.textContent = 'No posts in this thread yet. Be the first to reply!';
                postListElement.appendChild(noPostsMessage);
            }
        } catch (error) {
            console.error('Error in loadPosts:', error);
        }
    }

    // Create post item element
    function createPostItem(post) {
        const postItem = document.createElement('div');
        postItem.classList.add('post-item', 'win98-box');
        postItem.dataset.postId = post.id;

        const postHeader = document.createElement('div');
        postHeader.classList.add('win98-box-title');

        // Get author name
        let authorName = 'Unknown';
        if (post.users && (post.users.display_name || post.users.username)) {
            authorName = post.users.display_name || post.users.username;
        } else if (post.user_id === 'demo-user-id') {
            authorName = 'Demo User';
        } else if (post.user_id === 'other-user') {
            authorName = 'Forum User';
        }

        // Format date
        const createdDate = new Date(post.created_at).toLocaleDateString();
        const createdTime = new Date(post.created_at).toLocaleTimeString();

        postHeader.innerHTML = `<span>${authorName}</span><span>${createdDate} ${createdTime}</span>`;

        const postContent = document.createElement('div');
        postContent.classList.add('win98-box-content');
        postContent.innerHTML = post.content;

        // Add edit/delete buttons if user is the author or admin/moderator
        if (currentUser && (currentUser.id === post.user_id || currentUser.is_admin || currentUser.is_moderator)) {
            const actionButtons = document.createElement('div');
            actionButtons.classList.add('post-actions');

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                editPost(post.id, post.content);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deletePost(post.id);
            });

            actionButtons.appendChild(editButton);
            actionButtons.appendChild(deleteButton);
            postContent.appendChild(actionButtons);
        }

        postItem.appendChild(postHeader);
        postItem.appendChild(postContent);

        return postItem;
    }

    // Register new user
    async function registerUser(username, email, password, displayName) {
        if (!supabaseClient) {
            win98Alert('Registration successful! (Demo Mode)');
            setDemoUser();
            return;
        }

        try {
            // Register with Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (authError) {
                showError(authError.message);
                return;
            }

            // Create user profile
            if (authData && authData.user) {
                const { error: profileError } = await supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: authData.user.id,
                            username,
                            email,
                            display_name: displayName || username,
                            is_admin: false,
                            is_moderator: false
                        }
                    ]);

                if (profileError) {
                    console.error('Error creating user profile:', profileError);
                    showError('Registration successful, but there was an error creating your profile.');
                    return;
                }

                win98Alert('Registration successful! Please check your email to confirm your account.');
            }
        } catch (error) {
            console.error('Error in registration:', error);
            showError('Registration failed. Please try again later.');
        }
    }

    // Edit post function
    async function editPost(postId, currentContent) {
        if (!currentUser) {
            showError('You must be logged in to edit posts.');
            return;
        }

        isEditingPost = true;
        editingPostId = postId;

        // Get the post form and update it for editing
        const postForm = document.getElementById('post-form');
        const postContent = document.getElementById('post-content');
        const submitButton = postForm?.querySelector('button[type="submit"]');

        if (postForm && postContent instanceof HTMLTextAreaElement && submitButton) {
            postContent.value = currentContent;
            submitButton.textContent = 'Update Post';

            // Scroll to the form
            postForm.scrollIntoView({ behavior: 'smooth' });
            postContent.focus();
        }
    }

    // Delete post function
    async function deletePost(postId) {
        if (!currentUser) {
            showError('You must be logged in to delete posts.');
            return;
        }

        // Confirm deletion
        win98Confirm('Are you sure you want to delete this post?', async () => {
            if (!supabaseClient) {
                // In demo mode, just remove from DOM
                const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
                if (postElement && postElement.parentNode) {
                    postElement.parentNode.removeChild(postElement);
                }
                return;
            }

            try {
                // Delete from database
                const { error } = await supabaseClient
                    .from('posts')
                    .delete()
                    .eq('id', postId);

                if (error) {
                    console.error('Error deleting post:', error);
                    showError('Failed to delete post. Please try again.');
                    return;
                }

                // Remove from DOM
                const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
                if (postElement && postElement.parentNode) {
                    postElement.parentNode.removeChild(postElement);
                }

                win98Alert('Post deleted successfully.');
            } catch (error) {
                console.error('Error in deletePost:', error);
                showError('An error occurred while deleting the post.');
            }
        });
    }
    }