import { assert } from 'chai';
import moment from 'moment';
import Promise from 'bluebird';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as objectService from '../object';
import * as messageService from '../message';
import * as feedService from './index';

describe('Service: Feed', () => {
  describe('make', () => {
    let createdObject;
    let createdMessages;

    before(async () => {
      const serviceMessage = {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      };

      const createdExchange = await flexchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(3, 'hours').toISOString(),
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, serviceMessage);

      const createdMessage1 = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'Message for feed',
      }, serviceMessage);

      const createdMessage2 = await messageService.create({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        text: 'Second message for feed',
      }, serviceMessage);

      const createdMessage3 = messageService.create({
        parentType: 'team',
        parentId: '33',
        text: 'Second message for other feed',
      }, serviceMessage);

      createdMessages = [createdMessage1, createdMessage2, createdMessage3];

      createdObject = await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
        objectType: 'exchange',
        sourceId: createdExchange.id,
      });
    });

    after(async () => {
      await objectService.remove({ id: createdObject.id });
      await Promise.map(createdMessages, (m) => messageService.remove({ messageId: m.id }));
    });

    it('should return feed models', async () => {
      const actual = await feedService.make({
        parentType: 'network',
        parentId: global.networks.flexAppeal.id,
      }, { credentials: { id: global.users.admin.id } });

      assert.lengthOf(actual, 3);
      assert.equal(actual[0].objectType, 'message');
      assert.equal(actual[0].source.text, 'Message for feed');
      assert.equal(actual[1].objectType, 'message');
      assert.equal(actual[1].source.text, 'Second message for feed');
      assert.equal(actual[2].objectType, 'exchange');
      assert.equal(actual[2].parentType, 'network');
      assert.equal(actual[2].parentId, global.networks.flexAppeal.id);
    });
  });
});
