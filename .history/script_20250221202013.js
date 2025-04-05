document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    const resultsDiv = document.querySelector('.search-results');
    
    // Add a subtle glitch effect to the input
    searchInput.addEventListener('input', (e) => {
        const glitchChance = Math.random();
        if (glitchChance > 0.9) {
            const originalValue = e.target.value;
            e.target.value = originalValue.split('').map(char => 
                Math.random() > 0.8 ? String.fromCharCode(char.charCodeAt(0) + 1) : char
            ).join('');
            setTimeout(() => {
                e.target.value = originalValue;
            }, 50);
        }
    });

    // Add static effect to the background
    const createStaticEffect = () => {
        const staticOverlay = document.querySelector('.static-effect');
        if (staticOverlay) {
            const noise = generateNoise(100);
            staticOverlay.style.backgroundImage = `url(${noise})`;
        }
    };

    // Generate noise pattern
    const generateNoise = (density) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = density;
        canvas.height = density;

        const imageData = ctx.createImageData(density, density);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() * 255;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
            data[i + 3] = Math.random() * 25;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    };

    // Update static effect periodically
    setInterval(createStaticEffect, 100);

    // Mock search function (to be replaced with actual web scraping logic)
    const searchOldWebsites = async (query) => {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock results - in reality, this would connect to a backend service
        return [
            {
                title: "Ancient GeoCities Site - Last updated 2003",
                url: "http://geocities.archive.org/example",
                description: "A relic from the golden age of personal homepages..."
            },
            {
                title: "Web 1.0 Tutorial - Updated 2005",
                url: "http://oldweb.archive.org/tutorial",
                description: "Learn HTML with tables and frames..."
            }
        ];
    };

    // Handle search
    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        searchButton.disabled = true;
        searchButton.textContent = 'Searching through time...';

        try {
            const results = await searchOldWebsites(query);
            displayResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            searchButton.disabled = false;
            searchButton.textContent = 'Search';
        }
    });

    // Display results with a retro effect
    const displayResults = (results) => {
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = results.map(result => `
            <div class="result-item" style="opacity: 0.8">
                <h3>${result.title}</h3>
                <a href="${result.url}" class="result-link">${result.url}</a>
                <p>${result.description}</p>
            </div>
        `).join('');
    };
});