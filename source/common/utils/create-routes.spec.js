import { assert } from 'chai';
import preFetchNetwork from 'common/middlewares/prefetch-network';
import * as systemUnderTest from 'common/utils/create-routes';

describe('createRoutes', () => {
  describe('#createRoute', () => {
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
  });
});
