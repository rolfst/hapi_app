import { Integration } from 'shared/models';

export function createIntegration({ name, token }) {
  return Integration.create({ name, token });
}
