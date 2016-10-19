import * as reminderService from '../services/reminder';


export default async (req, reply) => {
  try {
    console.log('sending reminder');
    await reminderService.sendReminder(null);

    return reply({});
  } catch (err) {
    return reply(err);
  }
};
