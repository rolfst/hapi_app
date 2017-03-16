const mailTemplateConfig = require('../configs/mail-templates');

export default (network, user, password) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-invitationSenderFirstName-': network.superAdmin.firstName,
    '-email-': user.email,
    '-password-': password,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: network.superAdmin.fullName, email: network.superAdmin.email },
    subject: `Je inlog gegevens voor het Flex-Appeal netwerk ${network.name}`,
    template: network.welcomeMailTemplate || mailTemplateConfig.NEW_USER,
  };

  return { data, options };
};
