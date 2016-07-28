/* eslint-disable max-len */

import { string, number } from 'joi';
import preFetchNetwork from 'common/middlewares/prefetch-network';
import router from 'common/utils/router';
const basePath = 'modules/employee/handlers';
const baseUrl = '/v2/networks/{networkId}';

const routeConfig = {
  auth: 'jwt',
  pre: [{ method: preFetchNetwork, assign: 'network' }],
};

export default [
  router.get(`${baseUrl}/users/me`, require(`${basePath}/view-my-profile`)),
  router.put(`${baseUrl}/users/me`, require(`${basePath}/update-my-profile`)),
  {
    method: 'POST',
    path: `${baseUrl}/users`,
    handler: require(`${basePath}/invite-user`).default,
    config: {
      ...routeConfig,
      validate: {
        payload: {
          name: string().required(),
          email: string().email().required(),
          team_id: number(),
        },
      },
    },
  },
];
