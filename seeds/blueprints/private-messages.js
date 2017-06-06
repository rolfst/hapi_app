module.exports = (brandingOptions) => {
  return [{
    participants: [
      `beheerder@${brandingOptions.mailExtension}`,
      `medewerker@${brandingOptions.mailExtension}`,
    ],
    messages: [{
      text: 'Hoi Piet, heb je het nieuwe rooster al gezien? Ik heb je op een andere dag ingedeeld.',
      creator: `beheerder@${brandingOptions.mailExtension}`,
    }, {
      text: 'Ja klopt ik heb het gezien, bedankt voor je berichtje!',
      creator: `medewerker@${brandingOptions.mailExtension}`,
    }],
  }, {
    participants: [
      `beheerder@${brandingOptions.mailExtension}`,
      `medewerker-2@${brandingOptions.mailExtension}`,
    ],
    messages: [{
      text: 'Hoi Johan, ik ben erg ziek wakker geworden. Ik kan vandaag helaas niet werken.',
      creator: `medewerker@${brandingOptions.mailExtension}`,
    }],
  }];
};
