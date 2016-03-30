import Sequelize from 'sequelize';
import config from 'database.json';

const { host, database, username, password, dialect } = config[process.env.NODE_ENV];

const logging = process.env.NODE_ENV !== 'testing' ?
  log => console.info(log) : false;

export default new Sequelize(database, username, password, { host, dialect, logging });
