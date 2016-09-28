export default (network, user) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-invitationSenderFirstName-': network.SuperAdmin.firstName,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: network.SuperAdmin.fullName, email: network.SuperAdmin.email },
    subject: `U kan uw netwerk: ${network.name} voor Flex-Appeal configureren`,
    template: network.configurationMailTemplate || 'b1841cf3-076c-4976-9da8-11d3c5c3a1cb',
  };

  return { data, options };
};
