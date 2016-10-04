/* eslint no-console: "off" */
import Sequelize from 'sequelize';
import config from './database.json';

export const db = (() => {
  const connectionEnvironment = process.env.NODE_ENV === 'debug' ?
    'development' : process.env.NODE_ENV;
  const { host, database, username, password, dialect, port } = config[connectionEnvironment];

  const logging = process.env.ENABLE_LOGGING === 'true' ?
    log => console.info(log) : false;

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
  host: 'localhost',
  port: 8000,
  routes: {
    cors: {
      origin: ['*'],
      headers: ['Origin', 'X-API-Token', 'Content-Type', 'Accept'],
    },
  },
};

export default { db, server };
