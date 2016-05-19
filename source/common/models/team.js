import Sequelize from 'sequelize';
import model from 'connection';

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
    allowNull: false,
  },
}, {
  tableName: 'teams',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Team;
