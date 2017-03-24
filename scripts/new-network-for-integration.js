#!/usr/bin/env node
/* eslint-disable no-console */
const userRepo = require('../source/modules/core/repositories/user');
const networkRepo = require('../source/modules/core/repositories/network');
const args = require('yargs').argv;

const logger = require('../source/shared/services/logger')('JOB/createNetworkForIntegration');

/*
 * This script can be used to create a new network that has an integration enabled.
 * It will add our internal user by default.
 *
 * Example command:
 *
 * API_ENV=testing node scripts/new-network-for-integration.js \
 *   --name="My New Network" \
 *   --email="thomas@flex-appeal.nl"
 *   --externalId="api.externalpartner.com/12333"
 *   --integration="PMT"
 */

const validateArgs = () => {
  console.assert(args.externalId, 'Missing externalId argument');
  console.assert(args.name, 'Missing name argument');
  console.assert(args.integration, 'Missing integration argument');
  console.assert(['PMT'].includes(args.integration),
    'We do not support that integration yet. Currently supporting: PMT');
};

const main = async () => {
  try {
    validateArgs();

    const user = await userRepo.findUserBy({ email: args.email || 'intern@flex-appeal.nl' });

    const network = await networkRepo.createIntegrationNetwork({
      userId: user.id,
      externalId: args.externalId,
      name: args.name,
      integrationName: args.integration,
    });

    logger.info(`Successfully created network with id: ${network.id}`);

    process.exit(0);
  } catch (err) {
    logger.warn(err);
    process.exit(1);
  }
};

if (require.main === module) { main(); }
