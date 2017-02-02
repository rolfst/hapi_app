import { assert } from 'chai';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as pollService from '../../../poll/services/poll';
import * as messageService from './index';
import * as objectService from '../object';

describe('Service: Message', () => {
  describe('createMessage', () => {
    let admin;
    let network;
    let createdMessage;

    before(async () => {
      admin = await testHelpers.createUser({ password: 'foo' });
      network = await testHelpers.createNetwork({ userId: admin.id });

      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, {
        credentials: { id: admin.id },
        network: { id: network.id },
      });
    });

    after(() => testHelpers.cleanAll());

    it('should create a message entry', async () => {
      const expected = await messageService.get({ messageId: createdMessage.id });

      assert.isDefined(expected);
      assert.property(expected, 'objectId');
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should create a poll entry if resource is present', async () => {
      const objects = await objectService.list({
        parentType: 'message',
        parentId: createdMessage.id,
      });

      const pollEntry = await pollService.get({ pollId: objects[0].sourceId });

      assert.isDefined(pollEntry);
      assert.equal(pollEntry.networkId, network.id);
      assert.equal(pollEntry.userId, admin.id);
    });

    it('should create object entry for poll if resource is present', async () => {
      const expected = await objectService.list({
        parentType: 'message',
        parentId: createdMessage.id,
      });

      assert.lengthOf(expected, 1);
      assert.equal(expected[0].userId, admin.id);
      assert.equal(expected[0].objectType, 'poll');
      assert.isDefined(expected[0].sourceId);
    });

    xit('should create an attachment entry if resource is present', async () => {
      // TODO
    });

    xit('should create object entry for attachment if resource is present', async () => {
      // TODO
    });

    xit('should create object entry for message', async () => {
      // TODO
    });
  });
});
