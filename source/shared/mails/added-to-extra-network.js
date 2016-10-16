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
    template: '069a3507-94ce-46ad-8ee4-21c2fee3163c',
  };

  return { data, options };
};
