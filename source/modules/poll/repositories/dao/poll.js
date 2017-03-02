import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

const Poll = model.define('Poll', {
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
}, {
  tableName: 'polls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Poll;
