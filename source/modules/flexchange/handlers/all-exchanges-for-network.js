import { pick } from 'lodash';
import * as responseUtil from 'shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const { pre, auth, query } = req;
  const message = { ...pre, ...auth };
  const filter = pick(query, FILTER_PROPERTIES);

  try {
    const payload = { filter };
    const result = await flexchangeService.listExchangesForNetwork(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
