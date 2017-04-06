const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const ObjectSeen = model.define('ObjectSeen', {
  objectId: {
    type: Sequelize.INTEGER,
    field: 'object_id',
    allowNull: false
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at'
  }
}, {
  tableName: 'object_seen',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ObjectSeen;
