import Boom from 'boom';
import createError from 'common/utils/create-error';

const boom = Boom.forbidden('No integration setting found for network.');

export default createError(boom, 'integration_not_found');
