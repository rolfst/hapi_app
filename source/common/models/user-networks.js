import Sequelize from 'sequelize';
import model from 'connection';

const UserNetworks = model.define('UserNetworks', {
  externalId: { type: Sequelize.INTEGER },
  roleType: { type: Sequelize.STRING },
  unreadCount: { type: Sequelize.INTEGER },
  lastActive: { type: Sequelize.DATE },
  deletedAt: { type: Sequelize.DATE },
  userToken: { type: Sequelize.STRING },
});

export default UserNetworks;
