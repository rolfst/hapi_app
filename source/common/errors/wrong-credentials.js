import Boom from 'boom';
import createError from 'common/utils/create-error';

const boom = Boom.forbidden('No user found for given username and password.');

export default createError(boom, 'WrongCredentials');
