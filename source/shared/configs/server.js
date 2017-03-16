module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 8000,
  routes: {
    cors: {
      origin: ['*'],
      headers: ['Origin', 'X-API-Token', 'Content-Type', 'Accept'],
    },
  },
};
