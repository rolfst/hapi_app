#!/usr/bin/env node
/* eslint-disable no-console */
import userRepo from '../source/modules/core/repositories/user';
import networkRepo from '../source/modules/core/repositories/network';
import Logger from '../source/shared/services/logger';

const args = require('yargs').argv;
const logger = Logger.createLogger('SCRIPT/createNetworkForIntegration');

/*
 * This script can be used to create a new network that has an integration enabled.
 * It will add our internal user by default.
 *
 * Example command:
 *
 * API_ENV=testing babel-node scripts/new-network-for-integration.js \
 *   --name="My New Network" \
 *   --externalId="api.externalpartner.com/12333"
 *   --integration="PMT"
 */

const validateArgs = () => {
  console.assert(args.externalId, 'Missing externalId argument');
  console.assert(args.name, 'Missing name argument');
  console.assert(args.integration, 'Missing integration argument');
  console.assert(['PMT'].includes(args.integration), 'We do not support that integration name');
};

const main = async () => {
  try {
    const user = await userRepo.findUserBy({ email: 'intern@flex-appeal.nl' });

    validateArgs();

    const network = await networkRepo.createIntegrationNetwork({
      userId: user.id,
      externalId: args.externalId,
      name: args.name,
      integrationName: args.integration,
    });

    logger.info(`Successfully created network with id: ${network.id}.`);

    process.exit(0);
  } catch (err) {
    logger.warn(err);
    process.exit(1);
  }
};

if (require.main === module) { main(); }
