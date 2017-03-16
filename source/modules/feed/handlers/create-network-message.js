const messageService = require('../services/message');
const responseUtil = require('../../../shared/utils/response');

export default async (req, reply) => {
  try {
    const payload = {
      pollQuestion: req.payload.poll_question,
      pollOptions: req.payload.poll_options,
      parentType: 'network',
      parentId: req.params.networkId,
      text: req.payload.text || null,
      files: req.payload.files || [],
    };

    const message = { ...req.pre, ...req.auth };
    const feedItems = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
