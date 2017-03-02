import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';
import * as dateUtils from '../../../../shared/utils/date';
import { User } from '../../../core/repositories/dao';

const ExchangeComment = model.define('ExchangeComment', {
  exchangeId: {
    type: Sequelize.INTEGER,
    field: 'exchange_id',
    allowNull: false,
  },
  text: {
    type: Sequelize.TEXT('medium'), // eslint-disable-line new-cap
    allowNull: false,
  },
  createdBy: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
}, {
  tableName: 'exchange_comments',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'exchange_comment',
        id: this.id.toString(),
        text: this.text,
        created_at: dateUtils.toISOString(this.created_at),
      };

      if (this.User) {
        output = Object.assign(output, {
          user: this.User.toSimpleJSON(),
        });
      }

      return output;
    },
  },
});

export default ExchangeComment;
