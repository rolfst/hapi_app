import Promise from 'bluebird';
import
  makeAuthenticationPromises
from 'modules/authentication/services/make-authentication-promises';

const authenticateIntegrations = async (networks, credentials) => {
  try {
    const promises = makeAuthenticationPromises(networks, credentials);

    const values = await Promise
      .all(promises.map(p => p.reflect()))
      .filter(inspection => inspection.isFulfilled())
      .map(inspection => inspection.value());

    return values;
  } catch (err) {
    console.log('authenticateIntegrations', err);
  }
};

export default authenticateIntegrations;
