import Sequelize from 'sequelize';
import model from 'connection';

const Network = model.define('Network', {
  externalId: {
    type: Sequelize.STRING,
    field: 'external_id',
    allowNull: true,
  },
  userId: {
    type: Sequelize.STRING,
    field: 'user_id',
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
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
  place: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phoneNum: {
    type: Sequelize.INTEGER,
    field: 'phone_num',
    allowNull: true,
  },
  enabledComponents: {
    type: Sequelize.STRING,
    field: 'enabled_components',
  },
  welcomeMailTemplate: {
    type: Sequelize.STRING,
    field: 'welcome_mail_template',
  },
}, {
  tableName: 'networks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Network;
