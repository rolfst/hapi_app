import Sequelize from 'sequelize';
import { flatten } from 'lodash';
import model from '../../../../shared/configs/sequelize';
import * as dateUtils from '../../../../shared/utils/date';

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
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      const replaceChars = (string) => string.match(/([A-Z])\w+/g);

      return {
        type: 'network',
        id: this.id.toString(),
        name: this.name,
        has_integration: this.Integrations.length > 0,
        enabled_components: flatten(this.enabledComponents.split(',').map(replaceChars)),
        user: this.SuperAdmin.toSimpleJSON(),
        created_at: dateUtils.toISOString(this.createdAt),
      };
    },
  },
});

export default Network;
