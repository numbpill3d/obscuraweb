(function() {
    const images = [
        { src: 'https://via.placeholder.com/80/f0f/fff?text=W1', link: '#' },
        { src: 'https://via.placeholder.com/80/0f0/000?text=W2', link: '#' },
        { src: 'https://via.placeholder.com/80/00f/fff?text=W3', link: '#' },
        { src: 'https://via.placeholder.com/80/ff0/000?text=W4', link: '#' },
        { src: 'https://via.placeholder.com/80/f00/fff?text=W5', link: '#' }
    ];

    function createWidgetStrip(container) {
        const widgetStrip = document.createElement('div');
        widgetStrip.id = 'widget-strip';
        widgetStrip.style.display = 'flex';
        widgetStrip.style.overflowX = 'auto';

        // Display a subset of random images in the widget
        const shuffledImages = [...images].sort(() => 0.5 - Math.random());
        const widgetImages = shuffledImages.slice(0, Math.min(5, shuffledImages.length));

        widgetImages.forEach(image => {
            const widgetImage = document.createElement('img');
            widgetImage.src = image.src;
            widgetImage.style.width = '80px';
            widgetImage.style.height = '80px';
            widgetImage.style.margin = '0 5px';
            widgetImage.style.cursor = 'pointer';
            widgetImage.addEventListener('click', () => {
                window.open(image.link, '_blank');
            });
            widgetStrip.appendChild(widgetImage);
        });
        container.appendChild(widgetStrip);
    }

    const widgetContainers = document.querySelectorAll('#infinidex-widget');
    widgetContainers.forEach(container => {
        createWidgetStrip(container);
    });
})();
</script>