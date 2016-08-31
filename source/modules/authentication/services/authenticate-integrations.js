import Promise from 'bluebird';
import
  makeAuthenticationPromises
from 'modules/authentication/services/make-authentication-promises';

const authenticateIntegrations = async (networks, credentials) => {
  const promises = makeAuthenticationPromises(networks, credentials);

  const values = await Promise
    .all(promises.map(p => p.reflect()))
    .filter(inspection => inspection.isFulfilled())
    .map(inspection => inspection.value());

  return values;
};

export default authenticateIntegrations;
