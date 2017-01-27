import { assert } from 'chai';
import * as pollService from '../../../poll/services/poll';
import * as messageService from './index';
import * as objectService from '../object';

describe('Service: Message', () => {
  describe('create', () => {
    let createdMessage;

    before(async () => {
      createdMessage = await messageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, {
        credentials: { id: global.users.admin.id },
        network: { id: global.networks.flexAppeal.id },
      });
    });

    after(() => messageService.remove({ messageId: createdMessage.id }));

    it('should create a message entry', async () => {
      const expected = await messageService.get({ messageId: createdMessage.id });

      assert.isDefined(expected);
      assert.property(expected, 'objectId');
      assert.equal(expected.text, 'My cool message');
      assert.property(expected, 'createdAt');
    });

    it('should create a poll entry if resource is present', async () => {
      const objects = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.id,
      });

      const pollEntry = await pollService.get({ pollId: objects[0].sourceId });

      assert.isDefined(pollEntry);
      assert.equal(pollEntry.networkId, global.networks.flexAppeal.id);
      assert.equal(pollEntry.userId, global.users.admin.id);
    });

    it('should create object entry for poll if resource is present', async () => {
      const expected = await objectService.list({
        parentType: 'feed_message',
        parentId: createdMessage.id,
      });

      assert.lengthOf(expected, 1);
      assert.equal(expected[0].userId, global.users.admin.id);
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
