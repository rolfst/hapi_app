const usersBlueprint = require('./blueprints/users');
const messagesBlueprint = require('./blueprints/messages');
const exchangesBlueprint = require('./blueprints/exchanges');
const privateMessagesBlueprint = require('./blueprints/private-messages');

module.exports = (_brandingOptions) => {
  const brandingOptions = Object.assign({}, {
    organisationName: 'Supermarkt B.V',
    networkPrefix: 'Supermarkt',
    mailExtension: 'supermarkt.nl',
    brandIcon: null,
  }, _brandingOptions);

  return {
    name: brandingOptions.organisationName,
    admins: [`organisatiebeheerder@${brandingOptions.mailExtension}`],
    brandIcon: brandingOptions.brandIcon,
    users: usersBlueprint(brandingOptions),
    networks: [{
      name: `${brandingOptions.networkPrefix} Leiden`,
      admin: `beheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
        `beheerder-2@${brandingOptions.mailExtension}`,
        `medewerker@${brandingOptions.mailExtension}`,
        `medewerker-2@${brandingOptions.mailExtension}`,
        `medewerker-3@${brandingOptions.mailExtension}`,
      ],
      teams: [{
        name: 'Vulploeg',
        members: [`medewerker@${brandingOptions.mailExtension}`, `medewerker-2@${brandingOptions.mailExtension}`],
      }, {
        name: 'Servicebalie',
        members: [`medewerker@${brandingOptions.mailExtension}`, `medewerker-2@${brandingOptions.mailExtension}`],
      }, {
        name: 'Verkoopklaar',
        members: [`medewerker@${brandingOptions.mailExtension}`],
      }, {
        name: 'Kwaliteit',
        members: [`medewerker-2@${brandingOptions.mailExtension}`],
      }],
      messages: messagesBlueprint(brandingOptions),
      exchanges: exchangesBlueprint(brandingOptions),
    }, {
      name: `${brandingOptions.networkPrefix} Voorburg`,
      admin: `beheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
        `beheerder-2@${brandingOptions.mailExtension}`,
        `medewerker-3@${brandingOptions.mailExtension}`,
      ],
      teams: [{
        name: 'Vulploeg',
        members: [
          `medewerker@${brandingOptions.mailExtension}`,
          `medewerker-2@${brandingOptions.mailExtension}`,
        ],
      }, {
        name: 'Servicebalie',
        members: [
          `medewerker@${brandingOptions.mailExtension}`,
          `medewerker-2@${brandingOptions.mailExtension}`,
        ],
      }, {
        name: 'Verkoopklaar',
        members: [
          `medewerker@${brandingOptions.mailExtension}`,
        ],
      }, {
        name: 'Kwaliteit',
        members: [
          `medewerker-2@${brandingOptions.mailExtension}`,
        ],
      }],
    }, {
      name: `${brandingOptions.networkPrefix} Haarlem`,
      admin: `beheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
      ],
    }, {
      name: `${brandingOptions.networkPrefix} Sassenheim`,
      admin: `beheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
      ],
    }, {
      name: `${brandingOptions.networkPrefix} Amsterdam`,
      admin: `beheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
      ],
    }, {
      name: 'Regio Managers',
      admin: `organisatiebeheerder@${brandingOptions.mailExtension}`,
      users: [
        `organisatiebeheerder@${brandingOptions.mailExtension}`,
        `beheerder@${brandingOptions.mailExtension}`,
        `beheerder-2@${brandingOptions.mailExtension}`,
      ],
      teams: [{
        name: 'Algemeen',
        members: [
          `beheerder@${brandingOptions.mailExtension}`,
          `beheerder-2@${brandingOptions.mailExtension}`,
        ],
      }],
    }],
    privateMessages: privateMessagesBlueprint(brandingOptions),
  };
};
