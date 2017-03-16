/* eslint no-console: "off" */
const Sequelize = require('sequelize');
const Logger = require('../services/logger');
const config = require('./database');

const logger = Logger.createLogger('DB/query');

export default (() => {
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
