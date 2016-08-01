import { string, number } from 'joi';

export default {
  payload: {
    name: string().required(),
    email: string().email().required(),
    team_id: number(),
  },
};
