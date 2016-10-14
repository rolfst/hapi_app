import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    return reply({ data: responseUtil.toSnakeCase(req.pre.network) });
  } catch (err) {
    console.log('Error retrieving network information', err);
    return reply(err);
  }
};
