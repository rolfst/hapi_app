import { assert } from 'chai';
import moment from 'moment';
import sinon from 'sinon';
import Promise from 'bluebird';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as notifier from '../../../../shared/services/notifier';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as objectService from '../object';
import * as messageService from '../message';
import * as feedService from './index';

describe('Service: Feed', () => {
  describe('make', () => {
    let network;
    let admin;

    before(async () => {
      sinon.stub(notifier, 'send');
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });
      await testHelpers.addUserToNetwork({ userId: admin.id, networkId: network.id });

      const serviceMessage = {
        credentials: { id: admin.id },
        network: { id: network.id },
      };

      const createdExchange = await flexchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(3, 'hours').toISOString(),
        type: 'ALL',
        values: [network.id],
      }, serviceMessage);

      await Promise.delay(1000);

      await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Message for feed',
      }, serviceMessage);

      await Promise.delay(1000);

      await messageService.create({
        parentType: 'network',
        parentId: network.id,
        text: 'Second message for feed',
      }, serviceMessage);

      await Promise.delay(1000);

      await messageService.create({
        parentType: 'team',
        parentId: '33',
        text: 'Second message for other feed',
      }, serviceMessage);

      await objectService.create({
        userId: admin.id,
        parentType: 'network',
        parentId: network.id,
        objectType: 'exchange',
        sourceId: createdExchange.id,
      });
    });

    after(() => testHelpers.cleanAll());

    it('should return feed models in descending order by creation date', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      console.log(actual);

      assert.lengthOf(actual, 3);
      assert.equal(actual[0].objectType, 'exchange');
      assert.equal(actual[0].parentType, 'network');
      assert.equal(actual[0].parentId, network.id);
      assert.equal(actual[1].objectType, 'message');
      assert.equal(actual[1].source.text, 'Second message for feed');
      assert.equal(actual[2].objectType, 'message');
      assert.equal(actual[2].source.text, 'Message for feed');
    });

    it('should return feed models for subset with limit and offset query', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: network.id,
        offset: 1,
        limit: 1,
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].objectType, 'message');
      assert.equal(actual[0].source.text, 'Second message for feed');
    });
  });
});
