require('dotenv').config();

module.exports = {
  testing: {
    host: process.env.TEST_DB_HOST,
    database: process.env.TEST_DB_NAME,
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    dialect: 'mysql',
    migrationStorageTableName: 'sequelize_migrations',
  },
  development: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    migrationStorageTableName: 'sequelize_migrations',
  },
  acceptance: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    migrationStorageTableName: 'sequelize_migrations',
  },
  production: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    migrationStorageTableName: 'sequelize_migrations',
  },
};
