module.exports = (_brandingOptions) => {
  const brandingOptions = Object.assign({}, {
    welcomeMessage: `Hoi allemaal 👋!

      Welkom in ${_brandingOptions.organisationName}.
      Vanaf nu gebruiken wij Flex-Appeal als intern communicatie middel.
    `,
  }, _brandingOptions);

  return [{
    text: brandingOptions.welcomeMessage,
    creator: `organisatiebeheerder@${brandingOptions.mailExtension}`,
    comments: [{
      text: 'Bedankt Sandra! 👏',
      creator: `medewerker@${brandingOptions.mailExtension}`,
    }, {
      text: 'Hoi Sandra, bedankt! De app ziet er goed uit! 👍',
      creator: `medewerker-2@${brandingOptions.mailExtension}`,
    }],
    likes: [
      `beheerder@${brandingOptions.mailExtension}`,
      `medewerker@${brandingOptions.mailExtension}`,
      `medewerker-2@${brandingOptions.mailExtension}`,
    ],
  }, {
    pollQuestion: 'Wat vinden jullie van de nieuwe kantine?',
    pollOptions: ['Mooier 😻', 'Gezelliger 👌', 'Saai 😕 ', 'Geen verandering 😞'],
    creator: `beheerder@${brandingOptions.mailExtension}`,
    likes: [
      `beheerder@${brandingOptions.mailExtension}`,
      `beheerder-2@${brandingOptions.mailExtension}`,
      `medewerker-2@${brandingOptions.mailExtension}`,
    ],
  }];
};
