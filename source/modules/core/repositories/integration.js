import { Integration } from '../../../shared/models';

export function createIntegration({ name, token }) {
  return Integration.create({ name, token });
}

export const deleteById = async (integrationId) => {
  return Integration.destroy({ where: { id: integrationId } });
};

export const findAll = async () => {
  return Integration.findAll();
};
