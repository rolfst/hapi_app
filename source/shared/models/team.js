import Sequelize from 'sequelize';
import { db } from '../../connections';

const Team = db.define('Team', {
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
}, {
  tableName: 'teams',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Team;
