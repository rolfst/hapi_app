import { map, flatten } from 'lodash';
import * as dateUtils from '../../../shared/utils/date';
import createUserModel from './user';

const replaceChars = (string) => string.match(/([A-Z])\w+/g);

export default (dao) => ({
  type: 'network',
  id: dao.id.toString(),
  externalId: dao.externalId,
  name: dao.name,
  hasIntegration: dao.Integrations.length > 0,
  integrations: map(dao.Integrations, 'name'),
  superAdmin: createUserModel(dao.SuperAdmin),
  enabledComponents: flatten(dao.enabledComponents.split(',').map(replaceChars)),
  createdAt: dateUtils.toISOString(dao.created_at),
});
