import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Attachment = model.define('Attachment', {
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
  tableName: 'new_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Attachment;
