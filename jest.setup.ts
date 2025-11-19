import '@testing-library/jest-dom';

// Optional: mock window.scrollTo used by some components
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
