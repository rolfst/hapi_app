import Boom from 'boom';

export default class IntegrationNotFound {
  constructor() {
    return Boom.forbidden('No integration setting found for network.');
  }
}
