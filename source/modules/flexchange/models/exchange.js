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
  instanceMethods: {
    toJSON: function () { // eslint-disable-line
      let output = {
        type: 'exchange',
        id: this.id.toString(),
        title: this.title,
        description: this.description,
        date: formatDate(this.date),
        created_at: formatDate(this.created_at),
      };

      return output;
    },
  },
});

export default Exchange;
