(async function() {
    // Initialize Supabase client
    let supabaseClient = null;
    let images = [
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W1', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W2', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W3', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W4', link: '#', tags: 'placeholder' },
        { src: 'https://via.placeholder.com/80/c0c0c0/000000?text=W5', link: '#', tags: 'placeholder' }
    ];

    try {
        if (window.supabase) {
            console.log('Initializing Supabase client for widget...');
            const SUPABASE_URL = 'https://ibpnwppmlvlizuuxland.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicG53d3BtbHZsaXp1dXhsYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTcwMDAsImV4cCI6MjA1ODgzMzAwMH0.ZKlskNFBzS-tiIblQZJtSbDdva_X-sR2FE0aZaD56_A';
            
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Fetch images from Supabase
            const { data: fetchedImages, error } = await supabaseClient
                .from('images')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching images for widget:', error);
            } else if (fetchedImages && fetchedImages.length > 0) {
                images = fetchedImages.map(img => ({
                    src: img.image_url,
                    link: img.site_url,
                    tags: img.tags
                }));
                console.log('Fetched images for widget:', images);
            }
            console.log('Supabase client:', supabaseClient);
            console.log('Fetched images:', fetchedImages);
        }
    } catch (error) {
        console.error('Error initializing Supabase for widget:', error);
    }

    function createWidgetStrip(container) {
        // Create Windows 98 style container
        const win98Box = document.createElement('div');
        win98Box.style.border = '2px solid';
        win98Box.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        win98Box.style.backgroundColor = '#c0c0c0';
        win98Box.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)';
        win98Box.style.padding = '2px';
        win98Box.style.margin = '10px 0';
        
        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.style.background = 'linear-gradient(90deg, #000080, #1084d0)';
        titleBar.style.color = 'white';
        titleBar.style.fontWeight = 'bold';
        titleBar.style.padding = '3px 5px';
        titleBar.style.display = 'flex';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.alignItems = 'center';
        titleBar.innerHTML = '<span>THE UNDERWEB Widget</span><span>X</span>';
        
        // Create content area
        const contentArea = document.createElement('div');
        contentArea.style.padding = '10px';
        contentArea.style.backgroundColor = '#c0c0c0';
        
        // Create widget strip
        const widgetStrip = document.createElement('div');
        widgetStrip.id = 'widget-strip';
        widgetStrip.style.display = 'flex';
        widgetStrip.style.overflowX = 'auto';
        widgetStrip.style.padding = '5px';
        widgetStrip.style.backgroundColor = '#000000';
        widgetStrip.style.border = '2px inset #808080';

        // Display a subset of random images in the widget
        const shuffledImages = [...images].sort(() => 0.5 - Math.random());
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length));

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.src;
            widgetImage.alt = image.tags || 'THE UNDERWEB';
            widgetImage.style.width = '80px';
            widgetImage.style.height = '80px';
            widgetImage.style.margin = '0 5px';
            widgetImage.style.cursor = 'pointer';
            widgetImage.style.border = '2px solid #ffffff';
            widgetImage.title = image.tags || ''; // Show tags on hover
            widgetImage.addEventListener('click', () => {
                window.open(image.link, '_blank');
            });
            widgetStrip.appendChild(widgetImage);
        });
        
        // Add credit text
        const creditText = document.createElement('div');
        creditText.style.fontSize = '10px';
        creditText.style.textAlign = 'center';
        creditText.style.marginTop = '5px';
        creditText.innerHTML = '<a href="/" target="_blank">THE UNDERWEB</a> - Explore the hidden web';
        
        // Assemble the widget
        contentArea.appendChild(widgetStrip);
        contentArea.appendChild(creditText);
        win98Box.appendChild(titleBar);
        win98Box.appendChild(contentArea);
        container.appendChild(win98Box);
    }

    const widgetContainers = document.querySelectorAll('#underweb-widget');
    console.log('Widget containers:', widgetContainers);
    widgetContainers.forEach(container => {
        createWidgetStrip(container);
    });
})();
