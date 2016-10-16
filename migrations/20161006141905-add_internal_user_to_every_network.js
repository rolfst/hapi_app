'use strict';
require('babel-register');
const { User, Network } = require('../source/shared/models');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return User.findOne({ where: { username: 'intern@flex-appeal.nl' } }).then(user => {
      return Network.findAll().then(availableNetworks => {
        const promises = availableNetworks
          .map(network => network.addUser(user, {
            roleType: 'ADMIN',
            lastActive: new Date(),
            invisibleUser: true,
            isWelcomed: 1,
          }));

        return Promise.all(promises);
      });
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
