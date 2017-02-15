export default (actor, parent, message) => {
  const text = (!!parent.name) ?
    `${actor.fullName} in ${parent.name}: ${message.text}` :
    `${actor.fullName}: ${message.text}`;

  return {
    text,
    data: { id: message.id, type: 'message', track_name: 'message_created' },
  };
};
