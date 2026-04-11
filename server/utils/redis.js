const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;

let redis;

if (redisUrl) {
    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
            console.log('Successfully connected to Redis');
        });
    } catch (err) {
        console.error('Failed to initialize Redis:', err);
    }
} else {
    console.warn('REDIS_URL not found in environment. Caching is disabled.');
}

const getCache = async (key) => {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Redis get error:', err);
        return null;
    }
};

const setCache = async (key, value, ttlSeconds = 3600) => {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
        console.error('Redis set error:', err);
    }
};

module.exports = {
    getCache,
    setCache,
    redis
};
