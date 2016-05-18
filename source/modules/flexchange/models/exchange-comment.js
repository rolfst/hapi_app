import Sequelize from 'sequelize';
import model from 'connection';
import formatDate from 'common/utils/format-date';
import { User } from 'common/models';

const ExchangeComment = model.define('ExchangeComment', {
  parentId: {
    type: Sequelize.INTEGER,
    field: 'parent_id',
    allowNull: false,
  },
  parentType: {
    type: Sequelize.STRING,
    field: 'parent_type',
    allowNull: false,
  },
  text: {
    type: Sequelize.TEXT('medium'),
    allowNull: false,
  },
  createdBy: {
    type: Sequelize.INTEGER,
    field: 'created_by',
    allowNull: false,
  },
}, {
  tableName: 'comments',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line
      let output = {
        type: 'exchange_comment',
        id: this.id.toString(),
        text: this.text,
        created_at: formatDate(this.created_at),
      };

      if (this.User) {
        output = Object.assign(output, {
          user: this.User.toSimpleJSON()
        });
      }

      return output;
    },
  },
});

export default ExchangeComment;
