/* eslint no-console: "off" */
import Sequelize from 'sequelize';
import config from 'database.json';

const { host, database, username, password, dialect, port } = config[process.env.NODE_ENV];

const logging = process.env.NODE_ENV !== 'testing' ?
  log => console.info(log) : false;

const define = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

const dialectOptions = {
  charset: 'utf8mb4',
};

export default new Sequelize(database, username, password,
  { host, port, dialect, logging, define, dialectOptions }
);
