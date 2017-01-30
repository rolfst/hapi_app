import R from 'ramda';
import { Like } from './dao';
import createLikeModel from '../models/like';

export const findBy = async (whereConstraint) => Like
  .findAll({ where: whereConstraint })
  .then(R.map(createLikeModel));

export const create = async (messageId, userId) => Like
  .create({ messageId, userId })
  .then(createLikeModel);

export const remove = async (messageId, userId) => Like
  .destroy({ where: { messageId, userId } });
