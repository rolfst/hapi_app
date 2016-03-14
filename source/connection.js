import Sequelize from 'sequelize';
import config from 'database.json';

const { host, database, username, password } = config[process.env.NODE_ENV];

export default new Sequelize(database, username, password, {
  host,
  dialect: 'mysql',
});
