import Sequelize from 'sequelize';
import formatDate from 'common/utils/format-date';
import { db as model } from 'connections';

export const ActivityTypes = {
  EXCHANGE_CREATED: 'exchange_created',
  EXCHANGE_ACCEPTED: 'exchange_accepted',
  EXCHANGE_DECLINED: 'exchange_declined',
  EXCHANGE_APPROVED: 'exchange_approved',
  EXCHANGE_REJECTED: 'exchange_rejected',
  EXCHANGE_COMMENT: 'exchange_comment',
};

const Activity = model.define('Activity', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  activityType: {
    type: Sequelize.STRING,
    field: 'activity_type',
    allowNull: false,
  },
  sourceId: {
    type: Sequelize.INTEGER,
    field: 'source_id',
    allowNull: false,
  },
  date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  metaData: {
    type: Sequelize.TEXT,
    field: 'meta_data',
    allowNull: true,
    get: function () { // eslint-disable-line object-shorthand, func-names
      if (!this.getDataValue('metaData')) return {};

      return JSON.parse(this.getDataValue('metaData'));
    },
    set: function (val) { // eslint-disable-line object-shorthand, func-names
      this.setDataValue('metaData', JSON.stringify(val));
    },
  },
}, {
  tableName: 'activities',
  createdAt: 'date',
  updatedAt: false,
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      return {
        type: 'activity',
        data: {
          activity_type: this.activityType,
          source_id: this.sourceId.toString(),
          user: this.User.toSimpleJSON(),
          meta_data: this.metaData,
          date: formatDate(this.date),
        },
      };
    },
  },
});

export default Activity;
