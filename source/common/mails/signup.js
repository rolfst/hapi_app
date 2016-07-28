export default (network, user, password) => {
  const data = {
    '-firstName-': user.firstName,
    '-companyName-': network.name, // TODO: UTF-8 encode
    '-invitationSenderFirstName-': network.SuperAdmin.firstName,
    '-email-': user.email,
    '-password-': password,
  };

  const options = {
    receiver: { email: user.email },
    sender: { name: network.SuperAdmin.fullName, email: network.SuperAdmin.email },
    subject: `Je inlog gegevens voor het Flex-Appeal netwerk ${network.name}`,
    template: network.welcomeMailTemplate || 'b1841cf3-076c-4976-9da8-11d3c5c3a1cb',
  };

  return { data, options };
};
