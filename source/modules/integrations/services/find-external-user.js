import { find } from 'lodash';

export default (user, externalUsers) => {
  return find(externalUsers, { email: user.email });
};
