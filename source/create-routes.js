import coreRoutes from './modules/core/create-routes';
import integrationsRoutes from './modules/integrations/create-routes';
import authenticationRoutes from './modules/authentication/create-routes';
import employeeRoutes from './modules/employee/create-routes';
import chatRoutesV1 from './modules/chat/v1/create-routes';
import chatRoutesV2 from './modules/chat/v2/create-routes';
import flexchangeRoutes from './modules/flexchange/create-routes';

export default [
  ...coreRoutes,
  ...integrationsRoutes,
  ...chatRoutesV1,
  ...chatRoutesV2,
  ...flexchangeRoutes,
  ...employeeRoutes,
  ...authenticationRoutes,
];
