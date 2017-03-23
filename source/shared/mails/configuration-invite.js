const mailTemplateConfig = require('../configs/mail-templates');

module.exports = (network, user) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-email-': user.username,
    '-invitationSenderFirstName-': 'Flex Appeal',
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: 'Flex Appeal', email: 'uitnodigingen@flex-appeal.nl' },
    subject: `U kan uw netwerk: ${network.name} voor Flex-Appeal configureren`,
    template: mailTemplateConfig.CONFIGURE_NETWORK,
  };

  return { data, options };
};
