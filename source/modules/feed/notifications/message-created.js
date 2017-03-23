module.exports = (actor, parent, object) => {
  const text = parent.name ?
    `${actor.fullName} in ${parent.name}: ${object.source.text}` :
    `${actor.fullName}: ${object.source.text}`;

  return {
    text,
    data: { id: object.source.id, type: 'message', track_name: 'message_created' },
  };
};
