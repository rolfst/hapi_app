import mailTemplateConfig from '../configs/mail-templates';

export default (network, user, password) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-email-': user.username,
    '-invitationSenderFirstName-': 'Flex Appeal',
    '-password-': password,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: 'Flex Appeal', email: 'uitnodigingen@flex-appeal.nl' },
    subject: `U kan uw netwerk: ${network.name} voor Flex-Appeal configureren`,
    template: mailTemplateConfig.CONFIGURE_NETWORK,
  };

  return { data, options };
};
