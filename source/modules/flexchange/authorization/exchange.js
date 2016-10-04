import { UserRoles } from '../../../shared/services/permission';

export default {
  'accept-exchange': [UserRoles.EMPLOYEE, UserRoles.ADMIN],
  'decline-exchange': [UserRoles.EMPLOYEE, UserRoles.ADMIN],
  'approve-exchange': UserRoles.ADMIN,
  'reject-exchange': UserRoles.ADMIN,
};
