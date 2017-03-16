const { assert } = require('chai');
const { omit } = require('lodash');
const preFetchNetwork = require('../middlewares/prefetch-network');
const systemUnderTest = require('./create-routes');

describe('createRoutes', () => {
  describe('createRoute', () => {
    const routeStub = {
      method: 'POST',
      path: '/foo/baz',
      handler: 'handler',
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
        validate: 'my_validator',
      },
    };

    it('should create correct route object', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: 'handler',
        validator: 'my_validator',
      };

      const actual = systemUnderTest.createRoute(fakeRoute);

      assert.deepEqual(actual, routeStub);
    });

    it('should be able to add payload config', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: 'handler',
        validator: 'my_validator',
        payload: {
          foo: 'baz',
        },
      };

      const expected = {
        method: 'POST',
        path: '/foo/baz',
        handler: 'handler',
        config: {
          auth: 'jwt',
          payload: { foo: 'baz' },
          pre: [{ method: preFetchNetwork, assign: 'network' }],
          validate: 'my_validator',
        },
      };

      const actual = systemUnderTest.createRoute(fakeRoute);

      assert.deepEqual(actual, expected);
    });

    it('should handle es5 handler import with default property', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: { default: 'handler' },
        validator: { default: 'my_validator' },
      };

      const actual = systemUnderTest.createRoute(fakeRoute);

      assert.deepEqual(actual, routeStub);
    });

    it('should exclude authentication when option is passed', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: 'handler',
        validator: 'my_validator',
        auth: false,
      };

      const actual = systemUnderTest.createRoute(fakeRoute);
      const expected = { ...routeStub, config: omit(routeStub.config, 'auth', 'pre') };

      assert.deepEqual(actual, expected);
    });

    it('should be able to specify the auth strategy', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: 'handler',
        validator: 'my_validator',
        strategy: 'other_strategy',
      };

      const actual = systemUnderTest.createRoute(fakeRoute);
      const expected = { ...routeStub, config: {
        auth: 'other_strategy',
        validate: 'my_validator',
      } };

      assert.deepEqual(actual, expected);
    });

    it('should be able to disable prefetching network', () => {
      const fakeRoute = {
        method: 'POST',
        url: '/foo/baz',
        handler: 'handler',
        validator: 'my_validator',
        prefetch: false,
      };

      const actual = systemUnderTest.createRoute(fakeRoute);
      const expected = { ...routeStub, config: {
        auth: 'jwt',
        validate: 'my_validator',
      } };

      assert.deepEqual(actual, expected);
    });
  });
});
