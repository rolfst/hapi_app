import Boom from 'boom';

export default class NotInAnyNetwork {
  constructor() {
    return Boom.forbidden('The user does not belong to a network.');
  }
}
