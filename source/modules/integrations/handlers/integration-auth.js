import * as accessService from '../services/access';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('INTEGRATIONS/handler/integrationAuth');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth, deviceName: req.headers['user-agent'] };
    const payload = { ...req.payload, ...req.params };

    logger.info('Retrieving linked access token', { payload, message });
    const accessToken = await accessService.getLinkedAccessToken(payload, message);

    return reply({ data: { access_token: accessToken } });
  } catch (err) {
    return reply(err);
  }
};
