const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const Team = model.define('Team', {
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT('medium'), // eslint-disable-line new-cap
    allowNull: true,
  },
  externalId: {
    type: Sequelize.STRING,
    field: 'external_id',
    allowNull: true,
  },
  isChannel: {
    type: Sequelize.BOOLEAN,
    field: 'is_channel',
    defaultValue: false,
  },
}, {
  tableName: 'teams',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Team;
