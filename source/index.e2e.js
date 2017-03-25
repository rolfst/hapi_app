const { assert } = require('chai');
const createServer = require('./server');

describe('server', () => {
  it('should contain a start and stop function', () => {
    const server = createServer();

    assert.property(server, 'start');
    assert.property(server, 'stop');
  });

  it('should start and stop the server', (done) => {
    const server = createServer();
    server.start((err) => {
      if (err) return done(err);

      server.stop((error) => {
        if (!error) {
          return done();
        }
        throw error;
      });
    });
  });
});
