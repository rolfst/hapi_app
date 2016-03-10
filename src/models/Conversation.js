export default function Conversation(sequelize) {
  return sequelize.define('Conversation',
    {
      name: {
        type: sequelize.STRING,
        allowNull: false,
      },
    }
  ).sync().then(inst => {
    console.log(inst);
  });
}

export default Conversation;
