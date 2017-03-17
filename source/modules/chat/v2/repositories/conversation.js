const R = require('ramda');
const Sequelize = require('../../../../shared/configs/sequelize');
const { User } = require('../../../core/repositories/dao');
const { Conversation, ConversationUser } = require('./dao');
const createConversationModel = require('../models/conversation');

/**
 * Find multiple conversations
 * @param {string[]} conversationIds - The id of the conversation to find
 * @param {object} options - The options for pagination
 * @param {string} options.offset - The offset of the result set
 * @param {string} options.limit - The limit of the result set
 * @method findByIds
 * @return {external:Promise.<Conversation[]>} - Returns conversation models
 */
async function findByIds(conversationIds, options) {
  const result = await Conversation.findAll(R.merge(options,
    {
      include: { attributes: ['id'], model: User },
      where: { id: { $in: conversationIds } },
    }));

  return R.map(createConversationModel, result);
}

const findById = (conversationId) => findByIds([conversationId])
  .then(R.head);

async function countConversationsForUser(userId) {
  return ConversationUser.count({ where: { userId } });
}

/**
 * Find conversation ids for a specific user
 * @param {string} userId - User to find the conversations for
 * @method findIdsForUser
 * @return {external:Promise.<String[]>} - Returns conversation ids
 */
async function findIdsForUser(userId) {
  const pivotResult = await ConversationUser.findAll({
    attributes: ['conversation_id'],
    where: { userId },
    group: ['conversation_id'],
  });

  return R.pipe(R.pluck('conversation_id'), R.map(R.toString))(pivotResult);
}

/**
 * Create conversation
 * @param {object} attributes - The options for pagination
 * @param {string} attributes.type - The type of conversation
 * @param {string} attributes.userId - The id of the user that created the conversation
 * @param {string[]} attributes.participantIds - The ids of the participants
 * @method create
 * @return {external:Promise.<Conversation>}
 */
const create = async (attributes) => {
  const conversation = await Conversation.create({
    type: attributes.type,
    createdBy: attributes.userId,
  });

  await conversation.setUsers(attributes.participantIds);

  const model = createConversationModel(conversation);
  model.participantIds = attributes.participantIds;
  model.new = true;

  return model;
};

/**
 * Check if conversation already exists and return it if it does
 * @param {array} participantIds - Id's of users in the conversation
 * @method findExistingConversation
 * @return {Object.<Conversation>|null}
 */
const findExistingConversation = async (participantIds) => {
  const countUsersInConverrsation = Sequelize.fn('COUNT',
    Sequelize.fn('DISTINCT', Sequelize.col('`Users.ConversationUser`.`user_id`'))
  );
  const foundConversations = await Conversation.findAll({
    attributes: ['id', [countUsersInConverrsation, 'users_in_conversation']],
    include: [{
      model: User,
      where: { id: { $in: participantIds } },
    }],
    group: ['Conversation.id'],
    having: ['users_in_conversation = 2'],
  });

  if (foundConversations.length === 0) return null;

  const conversations = await findByIds(R.pluck('id', foundConversations));

  return conversations[0];
};

/**
 * Updates a conversation with the current timestamp
 * @param {string} conversationId
 * @param {object} attributes
 * @param {date} attributes.updatedAt
 * @method update
 */
function update(conversationId, { updatedAt }) {
  return Conversation.update({ updatedAt }, { where: { id: conversationId } });
}

/**
 * Deletes a conversation
 * @param {string} conversationId
 * @method deleteById
 */
const deleteById = (conversationId) => Conversation.destroy({
  where: { id: conversationId },
});

// exports of functions
module.export = {
  countConversationsForUser,
  create,
  deleteById,
  findById,
  findByIds,
  findIdsForUser,
  update,
};
