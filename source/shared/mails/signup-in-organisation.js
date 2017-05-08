const mailTemplateConfig = require('../configs/mail-templates');

module.exports = (organisation, user, password, invitor) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': organisation.name, // TODO: UTF-8 encode
    '-invitationSenderFirstName-': invitor.firstName,
    '-email-': user.email,
    '-password-': password,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: invitor.fullName, email: invitor.email },
    subject: `Je inlog gegevens voor het Flex-Appeal netwerk ${organisation.name}`,
    template: mailTemplateConfig.NEW_USER,
  };

  return { data, options };
};
