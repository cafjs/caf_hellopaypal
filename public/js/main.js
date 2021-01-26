if (typeof window !== 'undefined') {
    const app = require('./app');
    // use app.js directly for server side rendering
    app.main();
};
