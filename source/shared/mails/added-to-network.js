const mailTemplateConfig = require('../configs/mail-templates');

module.exports = (network, user) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-password-': user.plainPassword,
    '-invitationSenderFirstName-': network.superAdmin.firstName,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: network.superAdmin.fullName, email: network.superAdmin.email },
    subject: 'Je bent toegevoegd aan een Flex-Appeal netwerk',
    template: mailTemplateConfig.EXISTING_USER,
  };

  return { data, options };
};
