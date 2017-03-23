const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

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

module.exports = PollOption;
