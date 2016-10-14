import { deleteConversationById } from '../repositories/conversation';

export default async (req, reply) => {
  try {
    await deleteConversationById(req.params.id);

    return reply({ success: true });
  } catch (err) {
    console.log('Error deleting conversation', err);
    return reply(err);
  }
};
