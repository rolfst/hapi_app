const mailTemplateConfig = require('../configs/mail-templates');

module.exports = (organisation, user, invitor) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': organisation.name, // TODO: UTF-8 encode
    '-password-': user.plainPassword,
    '-invitationSenderFirstName-': invitor.firstName,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: invitor.fullName, email: invitor.email },
    subject: 'Je bent toegevoegd aan een Flex-Appeal organisatie',
    template: mailTemplateConfig.EXISTING_USER,
  };

  return { data, options };
};
