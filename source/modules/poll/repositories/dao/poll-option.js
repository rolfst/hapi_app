import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

const PollOption = model.define('PollOption', {
  pollId: {
    type: Sequelize.INTEGER,
    field: 'poll_id',
    allowNull: false,
  },
  text: Sequelize.STRING,
  order: Sequelize.INTEGER,
}, {
  tableName: 'poll_options',
  timestamps: false,
});

export default PollOption;
