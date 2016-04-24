import { assert } from 'chai';
import messageFactory from 'modules/chat/factories/message';

it('build a new message object', () => {
  const newMessage = messageFactory.buildForConversation(1, 2, 'Test message');

  assert.equal(newMessage.text, 'Test message');
  assert.equal(newMessage.messageType, 'default');
  assert.equal(newMessage.parentType, 'FlexAppeal\\Entities\\Conversation');
  assert.equal(newMessage.createdBy, 2);
});
