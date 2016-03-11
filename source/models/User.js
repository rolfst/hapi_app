import Sequelize from 'sequelize';
import model from 'connection';
import Conversation from './Conversation'; // deze is undefined

const User = model.define('User', {
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name',
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name',
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.sync();

export default User;
