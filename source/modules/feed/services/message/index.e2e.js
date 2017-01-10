import { assert } from 'chai';
import * as MessageService from './index';
import * as ObjectService from '../object';

describe.only('Service: Message', () => {
  describe('createMessage', () => {
    let createdMessage;

    before(async () => {
      createdMessage = await MessageService.create({
        parentType: 'network',
        parentId: '42',
        text: 'My cool message',
        resources: [{
          type: 'poll',
          data: { options: ['Yes', 'No', 'Ok'] },
        }],
      }, { credentials: { id: global.users.admin.id } });
    });

    it('should create a message entry', async () => {
      const expected = await MessageService.get({ messageId: createdMessage.id });

      assert.isDefined(expected);
      assert.equal(expected.text, 'My cool message');
      assert.equal(expected.userId, global.users.admin.id);
    });

    it('should create a poll entry if resource is present', async () => {
      // TODO
    });

    it('should create object entry for poll if resource is present', async () => {
      const expected = await ObjectService.list({
        parentType: 'message',
        parentId: createdMessage.id,
      });

      assert.lengthOf(expected, 1);
      assert.equal(expected[0].userId, global.users.admin.id);
      assert.equal(expected[0].objectType, 'poll');
      assert.isDefined(expected[0].sourceId);
    });

    it('should create an attachment entry if resource is present', async () => {
      // TODO
    });

    it('should create object entry for attachment if resource is present', async () => {
      // TODO
    });

    it('should create object entry for message', async () => {
      // TODO
    });
  });
});
