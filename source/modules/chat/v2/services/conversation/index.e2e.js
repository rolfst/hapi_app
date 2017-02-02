import { assert } from 'chai';
import blueprints from '../../../../../shared/test-utils/blueprints';
import * as userRepo from '../../../../core/repositories/user';
import * as objectService from '../../../../feed/services/object';
import * as messageService from '../../../../feed/services/message';
import * as conversationService from '../../services/conversation';

describe('Service: Conversation (v2)', () => {
  describe('remove', () => {
    let createdConversation;
    let creator;
    let participant;

    before(async () => {
      creator = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_creator' });

      participant = await userRepo.createUser({
        ...blueprints.users.employee,
        username: 'conversation_participant' });

      createdConversation = await conversationService.create({
        type: 'PRIVATE',
        participantIds: [creator.id, participant.id],
      }, { credentials: { id: creator.id } });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation.id,
        text: 'First message',
      }, {
        credentials: { id: participant.id },
      });

      await messageService.create({
        parentType: 'conversation',
        parentId: createdConversation.id,
        text: 'Last message',
      }, {
        credentials: { id: participant.id },
      });

      await conversationService.remove({ conversationId: createdConversation.id });
    });

    after(async () => {
      await conversationService.remove({ conversationId: createdConversation.id });
      await [creator, participant].map(user => userRepo.deleteById(user.id));
    });

    it('should remove related objects', async () => {
      const objectsForConversation = await objectService.list({
        parentType: 'conversation', parentId: createdConversation.id });

      assert.lengthOf(objectsForConversation, 0);
    });
  });
});
