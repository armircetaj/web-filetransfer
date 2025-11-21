document.addEventListener('DOMContentLoaded', () => {
    const { animate } = Motion;

    // --- Fade-in for page-subtitle ---
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageSubtitle) {
        animate(pageSubtitle, { opacity: [0, 1], y: [20, 0] }, {
            duration: 1.4,
            easing: 'ease-out',
            delay: 0 // <-- show after 2 seconds
        });
    }

    // --- Fade-in for glass-container ---
    const mainContent = document.querySelector('.glass-container');
    if (mainContent) {
        animate(mainContent, { opacity: [0, 1], y: [20, 0] }, {
            duration: 1,
            easing: 'ease-out',
            delay: 0.7 // <-- show after 2 seconds
        });
    }
    const downloadForm = document.querySelector('.download-form');
    if (downloadForm) {
        animate(downloadForm, {
            opacity: [0, 1],
            y: [30, 0]
        }, {
            duration: 1,
            easing: 'ease-out',
            delay: 0.2// starts slightly after the container
        });
    }

    // --- SPECIFIC ANIMATION: How It Works ---
    const howItWorks = document.querySelector('.how-it-works');
    if (howItWorks) {
        animate(howItWorks, {
            opacity: [0, 1],
            y: [40, 0]
        }, {
            duration: 1,
            easing: 'ease-out',
            delay: 0.2 // staggered nicely
        });
    }
    // --- Feature cards: animate on scroll ---
    const featureCards = document.querySelectorAll('.feature-card');

    if (featureCards.length > 0) {

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;

                    // Use index for staggering
                    const index = [...featureCards].indexOf(card);

                    animate(card, {
                        opacity: [0, 1],
                        y: [20, 0]
                    }, {
                        duration: 1.5,
                        easing: 'ease-out',
                        delay: index * 0.45
                    });

                    observer.unobserve(card);
                }
            });
        }, {
            threshold: 0.5 // Trigger when 20% enters the viewport
        });

        // Start with cards invisible
        featureCards.forEach(card => {
            card.style.opacity = 0;
            observer.observe(card);
        });
    }
});

