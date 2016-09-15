import Boom from 'boom';

export default class WrongCredentials {
  constructor() {
    return Boom.forbidden('No user found for given username and password.');
  }
}
