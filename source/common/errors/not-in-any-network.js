import Boom from 'boom';
import createError from 'common/utils/create-error';

const boom = Boom.forbidden('The user does not belong to a network.');

export default createError(boom, 'NotInAnyNetwork');
