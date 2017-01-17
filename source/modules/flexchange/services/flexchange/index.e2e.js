import { assert } from 'chai';
import exchangeService from './index';

describe.only('Service: Flexchange', () => {
  describe('list', () => {
    it('should return correct exchange models', async () => {
      const actual = await exchangeService.list({
        networkId: '42',
        exchangeIds: ['1', '2'],
      });
    });
  });
});
