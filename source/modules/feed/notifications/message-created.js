const R = require('ramda');

const hasAttachment = (object) => !!R.find(R.propEq('objectType', 'attachment'), object.children);
const hasPoll = (object) => !!R.find(R.propEq('objectType', 'poll'), object.children);

module.exports = (actor, parent, messageObject) => {
  const object = messageObject;
  // fallback on children
  object.children = object.children || [];

  const defaultHeadings = parent.name ? `${actor.fullName} @ ${parent.name}` : `${actor.fullName}`;
  const poll = R.find(R.propEq('objectType', 'poll'), object.children);

  const headings = R.cond([
    [hasPoll, R.always(`${defaultHeadings}`)],
    [R.T, R.always(defaultHeadings)],
  ])(object);

  const text = R.cond([
    [hasPoll, () => `Poll: ${poll.source.question} (${poll.source.options.length} opties)`],
    [hasAttachment, () => `(afbeelding) ${object.source.text}`],
    [R.T, R.always(object.source.text)],
  ])(object);

  return {
    headings,
    text,
    data: { id: object.source.id, type: 'message', track_name: 'message_created' },
  };
};
