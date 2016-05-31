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
    allowNull: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT('medium'), // eslint-disable-line new-cap
    allowNull: true,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM('USER', 'TEAM', 'ALL'), // eslint-disable-line new-cap
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
    defaultValue: 0,
  },
  declineCount: {
    type: Sequelize.INTEGER,
    field: 'decline_count',
    defaultValue: 0,
  },
  approvedUser: {
    type: Sequelize.INTEGER,
    field: 'approved_user',
    allowNull: true,
  },
  responseStatus: {
    type: Sequelize.VIRTUAL,
  },
}, {
  tableName: 'exchanges',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'exchange',
        id: this.id.toString(),
        title: this.title,
        description: this.description,
        date: formatDate(this.date),
        response_status: null,
        accept_count: this.acceptCount,
        decline_count: this.declineCount,
        created_at: formatDate(this.created_at),
      };

      if (this.ApprovedUser) {
        output = Object.assign(output, {
          approved_user: this.ApprovedUser.toSimpleJSON(),
        });
      }

      if (this.User) {
        output = Object.assign(output, {
          user: this.User.toSimpleJSON(),
        });
      }

      if (this.ExchangeResponses) {
        output = Object.assign(output, {
          responses: this.ExchangeResponses.map(res => res.toJSON()),
        });
      }

      if (this.ResponseStatus && this.ResponseStatus[0]) {
        if (this.ResponseStatus[0].approved !== null) {
          output.response_status = !!this.ResponseStatus[0].approved ? 'APPROVED' : 'REJECTED';
        } else {
          output.response_status = this.ResponseStatus[0].response ? 'ACCEPTED' : 'DECLINED';
        }
      }

      return output;
    },
  },
});

export default Exchange;
