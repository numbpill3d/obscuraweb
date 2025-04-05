document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const threadListElement = document.getElementById('thread-list');
    const threadFormElement = document.getElementById('thread-form');
    const postListElement = document.getElementById('post-list');
    const postFormElement = document.getElementById('post-form');
    const threadTitleElement = document.getElementById('thread-title');
    const backToThreadsButton = document.getElementById('back-to-threads');
    const threadViewElement = document.getElementById('thread-view');
    const threadsViewElement = document.getElementById('threads-view');
    const usernameInput = document.getElementById('username-input');
    const usernameForm = document.getElementById('username-form');
    const usernameDisplay = document.getElementById('username-display');
    const changeUsernameButton = document.getElementById('change-username');
    const userSection = document.getElementById('user-section');
    
    // State
    let currentUsername = localStorage.getItem('underweb_username') || '';
    let currentThreadId = null;
    
    // Initialize Supabase client if available
    let supabaseClient = null;
    try {
        if (window.supabase) {
            console.log('Supabase library found, initializing client');
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('Supabase library not found');
            showError('Supabase library not found. Forum functionality will be limited to demo mode.');
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        showError('Error initializing forum. Please try again later.');
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
    
    function showError(message) {
        win98Alert('Error: ' + message);
    }
    
    // Username handling
    function updateUsernameDisplay() {
        if (usernameDisplay) {
            usernameDisplay.textContent = currentUsername || 'Anonymous';
        }
        
        // Show/hide appropriate elements
        if (userSection) {
            if (currentUsername) {
                userSection.querySelector('.username-set').style.display = 'block';
                userSection.querySelector('.username-not-set').style.display = 'none';
            } else {
                userSection.querySelector('.username-set').style.display = 'none';
                userSection.querySelector('.username-not-set').style.display = 'block';
            }
        }
    }
    
    if (usernameForm) {
        usernameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUsername = usernameInput.value.trim();
            if (newUsername) {
                currentUsername = newUsername;
                localStorage.setItem('underweb_username', newUsername);
                updateUsernameDisplay();
                win98Alert('Username set to: ' + newUsername);
            } else {
                showError('Please enter a valid username');
            }
        });
    }
    
    if (changeUsernameButton) {
        changeUsernameButton.addEventListener('click', () => {
            if (userSection) {
                userSection.querySelector('.username-set').style.display = 'none';
                userSection.querySelector('.username-not-set').style.display = 'block';
            }
        });
    }
    
    // Thread list functions
    async function loadThreads() {
        if (!threadListElement) return;
        
        threadListElement.innerHTML = '<div class="loading">Loading threads...</div>';
        
        try {
            let threads = [];
            
            if (supabaseClient) {
                // Load threads from Supabase
                const { data, error } = await supabaseClient
                    .from('threads')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                threads = data;
            } else {
                // Demo mode - use placeholder threads
                threads = [
                    { id: 1, title: 'Welcome to THE UNDERWEB Forum', author: 'Admin', created_at: '2025-04-01T12:00:00Z', post_count: 5 },
                    { id: 2, title: 'Retro Web Design Tips', author: 'WebDesigner98', created_at: '2025-04-02T14:30:00Z', post_count: 3 },
                    { id: 3, title: 'Share Your Favorite Web 1.0 Sites', author: 'RetroFan', created_at: '2025-04-03T09:15:00Z', post_count: 7 },
                    { id: 4, title: 'Windows 98 Aesthetic Appreciation', author: 'VaporwaveEnthusiast', created_at: '2025-04-04T18:45:00Z', post_count: 2 }
                ];
            }
            
            if (threads.length === 0) {
                threadListElement.innerHTML = '<div class="no-threads">No threads yet. Be the first to create one!</div>';
                return;
            }
            
            threadListElement.innerHTML = '';
            
            threads.forEach(thread => {
                const threadElement = document.createElement('div');
                threadElement.classList.add('thread-item', 'win98-box');
                
                const threadDate = new Date(thread.created_at);
                const formattedDate = threadDate.toLocaleDateString() + ' ' + threadDate.toLocaleTimeString();
                
                threadElement.innerHTML = `
                    <div class="win98-box-title">
                        <span>${thread.title}</span>
                    </div>
                    <div class="win98-box-content">
                        <div class="thread-info">
                            <span class="thread-author">Posted by: ${thread.author}</span>
                            <span class="thread-date">${formattedDate}</span>
                            <span class="thread-posts">${thread.post_count || 0} posts</span>
                        </div>
                        <button class="view-thread-btn">View Thread</button>
                    </div>
                `;
                
                const viewButton = threadElement.querySelector('.view-thread-btn');
                viewButton.addEventListener('click', () => {
                    viewThread(thread.id, thread.title);
                });
                
                threadListElement.appendChild(threadElement);
            });
        } catch (error) {
            console.error('Error loading threads:', error);
            threadListElement.innerHTML = '<div class="error">Error loading threads. Please try again later.</div>';
        }
    }
    
    // Thread creation
    if (threadFormElement) {
        threadFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titleInput = threadFormElement.querySelector('#thread-title-input');
            const contentInput = threadFormElement.querySelector('#thread-content-input');
            
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            const author = currentUsername || 'Anonymous';
            
            if (!title || !content) {
                showError('Please fill in all fields');
                return;
            }
            
            try {
                if (supabaseClient) {
                    // First create the thread
                    const { data: threadData, error: threadError } = await supabaseClient
                        .from('threads')
                        .insert([
                            { title, author, post_count: 1 }
                        ])
                        .select();
                    
                    if (threadError) throw threadError;
                    
                    const threadId = threadData[0].id;
                    
                    // Then create the initial post
                    const { error: postError } = await supabaseClient
                        .from('posts')
                        .insert([
                            { thread_id: threadId, author, content }
                        ]);
                    
                    if (postError) throw postError;
                    
                    win98Alert('Thread created successfully!');
                    titleInput.value = '';
                    contentInput.value = '';
                    
                    // Reload threads and view the new thread
                    await loadThreads();
                    viewThread(threadId, title);
                } else {
                    // Demo mode
                    win98Alert('Thread created successfully! (Demo Mode)');
                    titleInput.value = '';
                    contentInput.value = '';
                    loadThreads();
                }
            } catch (error) {
                console.error('Error creating thread:', error);
                showError('Error creating thread. Please try again later.');
            }
        });
    }
    
    // Thread viewing
    async function viewThread(threadId, threadTitle) {
        if (!threadViewElement || !threadsViewElement || !postListElement) return;
        
        currentThreadId = threadId;
        
        // Update UI
        threadsViewElement.style.display = 'none';
        threadViewElement.style.display = 'block';
        
        if (threadTitleElement) {
            threadTitleElement.textContent = threadTitle;
        }
        
        // Load posts
        postListElement.innerHTML = '<div class="loading">Loading posts...</div>';
        
        try {
            let posts = [];
            
            if (supabaseClient) {
                // Load posts from Supabase
                const { data, error } = await supabaseClient
                    .from('posts')
                    .select('*')
                    .eq('thread_id', threadId)
                    .order('created_at', { ascending: true });
                
                if (error) throw error;
                posts = data;
            } else {
                // Demo mode - use placeholder posts
                posts = [
                    { id: 1, thread_id: threadId, author: 'Admin', content: 'Welcome to this thread! Please keep discussions civil and on-topic.', created_at: '2025-04-01T12:00:00Z' },
                    { id: 2, thread_id: threadId, author: 'RetroFan', content: 'Thanks for starting this thread! I\'m excited to discuss this topic.', created_at: '2025-04-01T12:15:00Z' },
                    { id: 3, thread_id: threadId, author: 'WebDesigner98', content: 'I remember when all websites looked like this. Good times!', created_at: '2025-04-01T12:30:00Z' }
                ];
            }
            
            if (posts.length === 0) {
                postListElement.innerHTML = '<div class="no-posts">No posts in this thread yet.</div>';
                return;
            }
            
            postListElement.innerHTML = '';
            
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-item', 'win98-box');
                
                const postDate = new Date(post.created_at);
                const formattedDate = postDate.toLocaleDateString() + ' ' + postDate.toLocaleTimeString();
                
                postElement.innerHTML = `
                    <div class="win98-box-title">
                        <span>${post.author}</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="win98-box-content">
                        <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
                
                postListElement.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
            postListElement.innerHTML = '<div class="error">Error loading posts. Please try again later.</div>';
        }
    }
    
    // Back to threads button
    if (backToThreadsButton) {
        backToThreadsButton.addEventListener('click', () => {
            if (threadViewElement && threadsViewElement) {
                threadViewElement.style.display = 'none';
                threadsViewElement.style.display = 'block';
                currentThreadId = null;
            }
        });
    }
    
    // Post creation
    if (postFormElement) {
        postFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentThreadId) {
                showError('No thread selected');
                return;
            }
            
            const contentInput = postFormElement.querySelector('#post-content-input');
            const content = contentInput.value.trim();
            const author = currentUsername || 'Anonymous';
            
            if (!content) {
                showError('Please enter a message');
                return;
            }
            
            try {
                if (supabaseClient) {
                    // Create the post
                    const { error: postError } = await supabaseClient
                        .from('posts')
                        .insert([
                            { thread_id: currentThreadId, author, content }
                        ]);
                    
                    if (postError) throw postError;
                    
                    // Update post count in thread
                    const { error: threadError } = await supabaseClient
                        .rpc('increment_post_count', { thread_id_param: currentThreadId });
                    
                    if (threadError) throw threadError;
                    
                    win98Alert('Reply posted successfully!');
                    contentInput.value = '';
                    
                    // Reload the current thread
                    const threadTitle = threadTitleElement ? threadTitleElement.textContent : '';
                    viewThread(currentThreadId, threadTitle);
                } else {
                    // Demo mode
                    win98Alert('Reply posted successfully! (Demo Mode)');
                    contentInput.value = '';
                    
                    // Simulate adding a new post in demo mode
                    const postElement = document.createElement('div');
                    postElement.classList.add('post-item', 'win98-box');
                    
                    const now = new Date();
                    const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
                    
                    postElement.innerHTML = `
                        <div class="win98-box-title">
                            <span>${author}</span>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="win98-box-content">
                            <div class="post-content">${content.replace(/\n/g, '<br>')}</div>
                        </div>
                    `;
                    
                    postListElement.appendChild(postElement);
                }
            } catch (error) {
                console.error('Error posting reply:', error);
                showError('Error posting reply. Please try again later.');
            }
        });
    }
    
    // Initialize
    updateUsernameDisplay();
    
    // If we're on the threads view, load threads
    if (threadsViewElement && threadsViewElement.style.display !== 'none') {
        loadThreads();
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
});
