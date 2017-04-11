module.exports = (actor, parent, object) => {
  return {
    headings: parent.name ? `${actor.fullName} in ${parent.name}` : `${actor.fullName}`,
    text: object.source.text,
    data: { id: object.source.id, type: 'message', track_name: 'message_created' },
  };
};
