import Sequelize from 'sequelize';
import model from 'connection';
import formatDate from 'common/utils/format-date';
import { User } from 'common/models';

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
  acceptCount: {
    type: Sequelize.INTEGER,
    field: 'accept_count',
  },
  declineCount: {
    type: Sequelize.INTEGER,
    field: 'decline_count',
  },
  approvedUser: {
    type: Sequelize.INTEGER,
    field: 'approved_user',
    allowNull: true,
  },
}, {
  tableName: 'exchanges',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line
      let output = {
        type: 'exchange',
        id: this.id.toString(),
        title: this.title,
        description: this.description,
        date: formatDate(this.date),
        vote_result: 'TODO',
        accept_count: this.acceptCount,
        decline_count: this.declineCount,
        created_at: formatDate(this.created_at),
      };

      if (this.ApprovedUser) {
        const user = this.ApprovedUser.toSimpleJSON();

        output = Object.assign(output, { accepted_user: user });
      }

      if (this.User) {
        const user = this.User.toSimpleJSON();

        output = Object.assign(output, { user });
      }

      return output;
    },
  },
});

export default Exchange;
