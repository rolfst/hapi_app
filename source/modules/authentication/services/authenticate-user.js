import { findUserByUsername } from 'common/repositories/user';
import WrongCredentials from 'common/errors/wrong-credentials';
import checkPassword from 'modules/authentication/utils/check-password';

export default async ({ username, password }) => {
  const user = await findUserByUsername(username);
  const validPassword = checkPassword(user.password, password);

  if (!validPassword) throw WrongCredentials;

  return user;
};
