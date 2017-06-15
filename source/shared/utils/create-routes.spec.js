const { assert } = require('chai');
const R = require('ramda');
const systemUnderTest = require('./create-routes');
const { EPrefetchData } = require('../../modules/authorization/definitions');

describe('createRoutes', () => {
  describe('createRoute', () => {
    const routeStub = {
      method: 'POST',
      path: '/foo/baz',
      handler: 'handler',
      config: {
        auth: 'jwt',
        validate: 'my_validator',
        app: { permissions: null, prefetch: EPrefetchData.NETWORK },
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
        prefetch: EPrefetchData.NETWORK,
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
          validate: 'my_validator',
          app: { permissions: null, prefetch: EPrefetchData.NETWORK },
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
      const expected = R.merge(routeStub, {
        config: R.merge(
          R.omit('auth', routeStub.config),
          { app: R.omit('prefetch', routeStub.config.app) }
        ),
      });

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
      const expected = R.merge(routeStub,
        { config: {
          auth: 'other_strategy',
          validate: 'my_validator',
          app: { permissions: null },
        } });

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
      const expected = R.merge(routeStub, { config: {
        auth: 'jwt',
        validate: 'my_validator',
        app: { permissions: null },
      } });

      assert.deepEqual(actual, expected);
    });
  });
});
