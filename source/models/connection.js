import Sequelize from 'sequelize';
import config from '../config';

const { host, name, username, password } = config.database;

export default new Sequelize(name, username, password, {
  host,
  dialect: 'mysql',
});
