import Mixpanel from 'mixpanel';
import * as Logger from './logger';

const logger = Logger.getLogger('SHARED/services/analytics');

export function getClient() {
  return Mixpanel.init(process.env.MIXPANEL_TOKEN);
}

export function registerProfile(user) {
  if (!user.id) throw new Error('User need to have at least an identifier.');

  const payload = {
    $first_name: user.firstName,
    $last_name: user.lastName,
    $email: user.email,
    $phone: user.phoneNum,
  };

  getClient().people.set(user.id, payload);
}

export function track(event, distinctId = null) {
  if (!distinctId) throw new Error('Missing distinctId parameter.');
  logger.info('Tracking event', { event, distinctId });

  return getClient().track(event.name, { ...event.data, distinct_id: distinctId });
}
