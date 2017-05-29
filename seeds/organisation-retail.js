const moment = require('moment');

module.exports = {
  name: 'Supermarkt B.V.',
  admins: ['organisatiebeheerder-1@flex-appeal.nl'],
  networks: [{
    name: 'Supermarkt Leiden',
    admin: 'beheerder-1@flex-appeal.nl',
    teams: [{
      name: 'Vulploeg',
      members: ['medewerker-1@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }, {
      name: 'Servicebalie',
      members: ['medewerker-1@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }, {
      name: 'Verkoopklaar',
      members: ['medewerker-1@flex-appeal.nl'],
    }, {
      name: 'Kwaliteit',
      members: ['medewerker-2@flex-appeal.nl'],
    }],
    messages: [{
      text: 'Hoi allemaal 👋! Welkom in Supermarkt B.V. Vanaf nu gebruiken wij Flex-Appeal als intern communicatie middel.',
      creator: 'organisatiebeheerder-1@flex-appeal.nl',
      comments: [{
        text: 'Bedankt Sandra! 👏',
        creator: 'medewerker-1@flex-appeal.nl',
      }, {
        text: 'Hoi Sandra, bedankt! De app ziet er goed uit! 👍',
        creator: 'medewerker-2@flex-appeal.nl',
      }],
      likes: ['beheerder-1@flex-appeal.nl', 'medewerker-1@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }, {
      pollQuestion: 'Wat vinden jullie van de nieuwe kantine?',
      pollOptions: ['Mooier 😻', 'Gezelliger 👌', 'Saai 😕 ', 'Geen verandering 😞'],
      creator: 'beheerder-1@flex-appeal.nl',
      likes: ['beheerder-1@flex-appeal.nl', 'beheerder-2@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }],
    exchanges: [{
      date: moment().toISOString(),
      startTime: moment().hours(14).minutes(30).toISOString(),
      endTime: moment().hours(21).minutes(0).toISOString(),
      description: 'Ik heb een bruiloft van een goede vriendin.',
      creator: 'medewerker-2@flex-appeal.nl',
    }, {
      date: moment().add(1, 'days').toISOString(),
      startTime: moment().add(1, 'days').hours(9).minutes(0).toISOString(),
      endTime: moment().add(1, 'days').hours(16).minutes(45).toISOString(),
      creator: 'medewerker-1@flex-appeal.nl',
    }, {
      date: moment().add(1, 'days').toISOString(),
      startTime: moment().add(1, 'days').hours(16).minutes(30).toISOString(),
      endTime: moment().add(1, 'days').hours(19).minutes(45).toISOString(),
      creator: 'medewerker-1@flex-appeal.nl',
    }],
  }, {
    name: 'Supermarkt Voorburg',
    admin: 'beheerder-1@flex-appeal.nl',
    teams: [{
      name: 'Vulploeg',
      members: ['medewerker-1@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }, {
      name: 'Servicebalie',
      members: ['medewerker-1@flex-appeal.nl', 'medewerker-2@flex-appeal.nl'],
    }, {
      name: 'Verkoopklaar',
      members: ['medewerker-1@flex-appeal.nl'],
    }, {
      name: 'Kwaliteit',
      members: ['medewerker-2@flex-appeal.nl'],
    }],
  }, {
    name: 'Regio Managers',
    admin: 'organisatiebeheerder-1@flex-appeal.nl',
    teams: [{
      name: 'Algemeen',
      members: ['beheerder-1@flex-appeal.nl', 'beheerder-2@flex-appeal.nl'],
    }],
  }],
};