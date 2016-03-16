import Sequelize from 'sequelize';
import model from 'connection';

const User = model.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name',
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name',
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  profileImg: {
    type: Sequelize.STRING,
    field: 'profile_img',
    allowNull: false,
  },
  password: Sequelize.STRING,
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  getterMethods: {
    type: () => 'users',
  },
});

export default User;
