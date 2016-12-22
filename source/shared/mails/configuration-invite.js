export default (network, user) => {
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
    template: network.welcomeMailTemplate || 'b1841cf3-076c-4976-9da8-11d3c5c3a1cb',
  };

  return { data, options };
};
