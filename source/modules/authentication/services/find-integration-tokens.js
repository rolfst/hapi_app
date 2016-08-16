import { findUserById } from 'common/repositories/user';
import
  getIntegrationTokensForUser
from 'modules/authentication/utils/get-integration-tokens-for-user';

export default async (userId) => {
  const user = await findUserById(userId);

  return getIntegrationTokensForUser(user);
};
