import Sequelize from 'sequelize';
import { db as model } from 'connections';
import formatDate from 'common/utils/format-date';

export const exchangeTypes = {
  NETWORK: 'ALL',
  TEAM: 'TEAM',
};

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
    type: Sequelize.ENUM( // eslint-disable-line new-cap
      exchangeTypes.NETWORK, exchangeTypes.TEAM
    ),
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
  approvedUserId: {
    type: Sequelize.INTEGER,
    field: 'approved_user',
    allowNull: true,
  },
  shiftId: {
    type: Sequelize.INTEGER,
    field: 'external_shift_id',
    allowNull: true,
  },
  responseStatus: {
    type: Sequelize.VIRTUAL,
  },
}, {
  tableName: 'exchanges',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
        is_approved: !!this.approvedUserId,
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

      if (this.Comments) {
        output = Object.assign(output, {
          comments: this.Comments.map(res => res.toJSON()),
        });
      }

      if (this.ResponseStatus) {
        if (this.ResponseStatus.approved !== null) {
          output.response_status = !!this.ResponseStatus.approved ? 'APPROVED' : 'REJECTED';
        } else {
          output.response_status = this.ResponseStatus.response ? 'ACCEPTED' : 'DECLINED';
        }
      }

      if (this.ExchangeValues) {
        let exchangeValueOutput;

        if (this.type === exchangeTypes.NETWORK) {
          exchangeValueOutput = { type: 'network', id: this.ExchangeValues[0].value };
        } else {
          const valueIds = this.ExchangeValues.map(v => v.value);
          exchangeValueOutput = { type: this.type.toLowerCase(), ids: valueIds };
        }

        output = { ...output, created_in: exchangeValueOutput };
      }

      return output;
    },
  },
});

export default Exchange;
