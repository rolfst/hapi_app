import { assert } from 'chai';
import moment from 'moment';
import Promise from 'bluebird';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as objectService from '../object';
import * as serviceUnderTest from './index';

describe('Service: Feed', () => {
  describe.only('make', () => {
    let objects;

    before(async () => {
      const createdExchange = await flexchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(3, 'hours').toISOString(),
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });

      const object1 = await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'exchange',
        sourceId: createdExchange.id,
      });

      const object2 = await objectService.create({
        userId: global.users.admin.id,
        parentType: 'network',
        parentId: '42',
        objectType: 'message',
        sourceId: '2',
      });

      objects = [object1, object2];
    });

    after(() => Promise.map(objects, (obj) => objectService.remove({ id: obj.id })));

    it('should return feed models', async () => {
      const actual = await serviceUnderTest.make({
        parentType: 'network',
        parentId: '42',
      }, { credentials: { id: global.users.admin.id } });
    });
  });
});
