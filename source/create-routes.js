import coreRoutes from './modules/core/create-routes';
import integrationsRoutes from './modules/integrations/create-routes';
import authenticationRoutes from './modules/authentication/create-routes';
import employeeRoutes from './modules/employee/create-routes';
import chatRoutes from './modules/chat/create-routes';
import flexchangeRoutes from './modules/flexchange/create-routes';
import pollRoutes from './modules/poll/create-routes';
import feedRoutes from './modules/feed/create-routes';

export default [
  ...coreRoutes,
  ...integrationsRoutes,
  ...authenticationRoutes,
  ...employeeRoutes,
  ...chatRoutes,
  ...flexchangeRoutes,
  ...pollRoutes,
  ...feedRoutes,
];
