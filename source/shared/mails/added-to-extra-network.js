const mailTemplateConfig = require('../configs/mail-templates');

export default (network, user) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
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
