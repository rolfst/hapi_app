import Sequelize from 'sequelize';
import * as password from '../../../../shared/utils/password';
import * as dateUtils from '../../../../shared/utils/date';
import { db as model } from '../../../../connections';

const User = model.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  profileImg: {
    type: Sequelize.STRING,
    field: 'profile_img',
    allowNull: false,
  },
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name',
    allowNull: true,
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name',
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    set: function (val) { // eslint-disable-line object-shorthand, func-names
      this.setDataValue('password', password.make(val));
    },
  },
  address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  zipCode: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'zip_code',
  },
  dateOfBirth: {
    type: Sequelize.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
  },
  phoneNum: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'phone_num',
  },
  functionName: {
    type: Sequelize.VIRTUAL,
  },
  integrationAuth: {
    type: Sequelize.VIRTUAL,
  },
  role: {
    type: Sequelize.VIRTUAL,
  },
  lastLogin: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'last_login',
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  getterMethods: {
    fullName: function () { // eslint-disable-line func-names, object-shorthand
      return `${this.firstName || ''} ${this.lastName || ''}`;
    },
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let environment = 'production';
      if (process.env.API_ENV === 'acceptance') environment = 'acc';
      if (process.env.API_ENV === 'development') environment = 'staging';

      return {
        type: 'user',
        id: this.id.toString(),
        username: this.username,
        first_name: this.firstName,
        last_name: this.lastName,
        full_name: this.fullName,
        function: this.functionName,
        integration_auth: this.integrationAuth,
        email: this.email,
        address: this.address,
        zip_code: this.zipCode,
        phone_num: this.phoneNum,
        profile_img: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${this.profileImg}`,
        date_of_birth: this.dateOfBirth,
        role_type: this.role,
        created_at: dateUtils.toISOString(this.created_at),
        last_login: dateUtils.toISOString(this.lastLogin),
      };
    },
    toSimpleJSON: function () { // eslint-disable-line func-names, object-shorthand
      let environment = 'production';
      if (process.env.API_ENV === 'acceptance') environment = 'acc';
      if (process.env.API_ENV === 'development') environment = 'staging';

      return {
        type: 'user',
        id: this.id.toString(),
        full_name: this.fullName,
        profile_img: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${this.profileImg}`,
      };
    },
  },
});

export default User;
