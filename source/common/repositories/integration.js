import { Integration } from 'common/models';

export function createIntegration({ name, token }) {
  return Integration.create({ name, token });
}
