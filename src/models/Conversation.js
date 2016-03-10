import Sequelize from 'sequelize';

function Conversation(sequelize) {
  return sequelize.define('Conversation',
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }
  ).sync().then(inst => {
    console.log(inst);
  });
}

module.exports = Conversation;
