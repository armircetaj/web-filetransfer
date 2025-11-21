document.addEventListener('DOMContentLoaded', function() {
    // Motion is available globally as window.Motion
    const { animate } = Motion;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        animate(mainContent, {
            opacity: [0, 1],
            y: [20, 0]
        }, {
	    duration: 2.8,
            easing: 'ease-out'
        });
    }
   const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
        featureCards.forEach((card, index) => {
            animate(card, {
                opacity: [0, 1],
                y: [20, 0]
            }, {
                duration: 3.6,
                easing: 'ease-out',
                delay: 0.3 + (index * 0.1) // Stagger each card
            });
        });
    }

});
