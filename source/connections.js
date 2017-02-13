/* eslint no-console: "off" */
import Sequelize from 'sequelize';
import config from './database.js';
import * as Logger from './shared/services/logger';

const logger = Logger.createLogger('DB/query');

export const db = (() => {
  const { host, database, username, password, dialect, port } = config[process.env.API_ENV];

  const logging = process.env.SQL_LOGGING === 'true' ?
    log => logger.info(log) : false;

  const define = {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  };

  const dialectOptions = {
    charset: 'utf8mb4',
  };

  return new Sequelize(database, username, password,
    { host, port, dialect, logging, define, dialectOptions }
  );
})();

export const server = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 8000,
  routes: {
    cors: {
      origin: ['*'],
      headers: ['Origin', 'X-API-Token', 'Content-Type', 'Accept'],
    },
  },
};

export default { db, server };
