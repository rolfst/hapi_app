import Boom from 'boom';
import createError from 'common/utils/create-error';

const boom = Boom.unauthorized('Token is expired.');

export default createError(boom, 'TokenExpired');
