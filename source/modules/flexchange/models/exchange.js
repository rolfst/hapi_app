import Sequelize from 'sequelize';
import model from 'connection';

const Exchange = model.define('Exchange', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
    allowNull: false,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT('medium'),
    allowNull: false,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM('USER', 'TEAM', 'ALL'),
    allowNull: false,
  },
  approvedBy: {
    type: Sequelize.INTEGER,
    field: 'approved_by',
    allowNull: true,
  },
}, {
  tableName: 'services',
  timestamps: false,
});

export default Exchange;
