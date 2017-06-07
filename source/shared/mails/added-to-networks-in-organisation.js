const mailTemplateConfig = require('../configs/mail-templates');

module.exports = (organisation, user, message) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': organisation.name, // TODO: UTF-8 encode
    '-invitationSenderFirstName-': message.credentials.firstName,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: message.credentials.fullName, email: message.credentials.email },
    subject: 'Je bent toegevoegd aan een Flex-Appeal netwerk',
    template: mailTemplateConfig.EXISTING_USER,
  };

  return { data, options };
};
