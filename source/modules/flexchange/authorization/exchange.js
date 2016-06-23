import { roles } from 'common/services/permission';

export default {
  'accept-exchange': [roles.EMPLOYEE, roles.ADMIN],
  'decline-exchange': [roles.EMPLOYEE, roles.ADMIN],
  'approve-exchange': roles.ADMIN,
  'reject-exchange': roles.ADMIN,
};
