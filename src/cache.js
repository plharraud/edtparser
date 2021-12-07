const nodeCache = require('node-cache');

const cache = new nodeCache({
    stdTTL: process.env.CACHE_TTL_MINUTES * 60
});

module.exports = {
    cache
}