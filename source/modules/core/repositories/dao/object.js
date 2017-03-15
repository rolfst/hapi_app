import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

const _Object = model.define('_Object', {
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
  objectType: {
    type: Sequelize.STRING,
    field: 'object_type',
    allowNull: false,
  },
  sourceId: {
    type: Sequelize.INTEGER,
    field: 'source_id',
    allowNull: false,
  },
  parentType: {
    type: Sequelize.STRING,
    field: 'parent_type',
    allowNull: false,
  },
  parentId: {
    type: Sequelize.INTEGER,
    field: 'parent_id',
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'objects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default _Object;
