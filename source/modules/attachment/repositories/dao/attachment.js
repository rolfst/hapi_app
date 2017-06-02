const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const Attachment = model.define('Attachment', {
  messageId: {
    type: Sequelize.INTEGER,
    field: 'message_id',
    allowNull: true,
  },
  parentType: {
    type: Sequelize.STRING,
    field: 'parent_type',
    allowNull: true,
  },
  parentId: {
    type: Sequelize.INTEGER,
    field: 'parent_id',
    allowNull: true,
  },
  objectId: {
    type: Sequelize.INTEGER,
    field: 'object_id',
    allowNull: true,
  },
  path: {
    type: Sequelize.STRING,
    field: 'path',
    allowNull: false,
  },
}, {
  tableName: 'attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Attachment;
