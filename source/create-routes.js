const coreRoutes = require('./modules/core/create-routes');
const integrationsRoutes = require('./modules/integrations/create-routes');
const authenticationRoutes = require('./modules/authentication/create-routes');
const employeeRoutes = require('./modules/employee/create-routes');
const chatRoutesV1 = require('./modules/chat/v1/create-routes');
const chatRoutesV2 = require('./modules/chat/v2/create-routes');
const flexchangeRoutes = require('./modules/flexchange/create-routes');
const pollRoutes = require('./modules/poll/create-routes');
const feedRoutes = require('./modules/feed/create-routes');
const attachmentRoutes = require('./modules/attachment/create-routes');
const statisticRoutes = require('./modules/statistics/create-routes');
const workflowRoutes = require('./modules/workflow/create-routes');

module.exports = [
  ...coreRoutes,
  ...integrationsRoutes,
  ...authenticationRoutes,
  ...employeeRoutes,
  ...chatRoutesV1,
  ...chatRoutesV2,
  ...flexchangeRoutes,
  ...pollRoutes,
  ...feedRoutes,
  ...attachmentRoutes,
  ...statisticRoutes,
  ...workflowRoutes,
];
