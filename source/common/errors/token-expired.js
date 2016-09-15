import Boom from 'boom';

export default class TokenExpired {
  constructor() {
    return Boom.unauthorized('Token is expired.');
  }
}
