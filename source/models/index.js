import ConversationModel from 'models/Conversation';
import UserModel from 'models/User';
import MessageModel from 'models/Message';

import buildUserRelationships from 'models/relationships/User';
import buildConversationRelationships from 'models/relationships/Conversation';
import buildMessageRelationships from 'models/relationships/Message';

buildConversationRelationships(ConversationModel, UserModel, MessageModel);
buildUserRelationships(UserModel, ConversationModel);
buildMessageRelationships(MessageModel, UserModel);

export const Conversation = ConversationModel;
export const User = UserModel;
export const Message = MessageModel;
