/* eslint no-console: "off" */
const Sequelize = require('sequelize');
const config = require('./database');

const logger = require('../services/logger')('DB/query');

module.exports = (() => {
  const { host, database, username, password, dialect, port } = config[process.env.API_ENV];

  const logging = process.env.SQL_LOGGING === 'true' ?
    (log) => logger.debug(log) : false;

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
