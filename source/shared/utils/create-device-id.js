import uuid from 'uuid-v4';

export default () => {
  return uuid().toUpperCase().replace(/-/g, '');
};
