import { animate } from 'motion';

animate('.main-content', {
    opacity: [0, 1], y: [20, 0],
}, {
    duration: 0.5,
    ease: 'easeInOut',
});
animate('.feature-cards', {
    opacity: [0, 1], y: [20, 0],
}, {
    duration: 0.5,
    ease: 'easeInOut',
});