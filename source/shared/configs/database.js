require('dotenv').config();

exports.testing = {
  host: process.env.TEST_DB_HOST,
  database: process.env.TEST_DB_NAME,
  username: process.env.TEST_DB_USERNAME,
  password: process.env.TEST_DB_PASSWORD,
  port: process.env.TEST_DB_PORT,
  dialect: 'mysql',
  migrationStorageTableName: 'sequelize_migrations',
};

exports.development = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  migrationStorageTableName: 'sequelize_migrations',
};

exports.acceptance = {
  host: process.env.ACCEPTANCE_DB_HOST,
  database: process.env.ACCEPTANCE_DB_NAME,
  username: process.env.ACCEPTANCE_DB_USERNAME,
  password: process.env.ACCEPTANCE_DB_PASSWORD,
  port: process.env.ACCEPTANCE_DB_PORT,
  dialect: 'mysql',
  migrationStorageTableName: 'sequelize_migrations',
};

exports.production = {
  host: process.env.PRODUCTION_DB_HOST,
  database: process.env.PRODUCTION_DB_NAME,
  username: process.env.PRODUCTION_DB_USERNAME,
  password: process.env.PRODUCTION_DB_PASSWORD,
  port: process.env.PRODUCTION_DB_PORT,
  dialect: 'mysql',
  migrationStorageTableName: 'sequelize_migrations',
};
