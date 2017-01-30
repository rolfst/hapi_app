import R from 'ramda';
import { Comment } from './dao';
import createCommentModel from '../models/comment';

export const findBy = async (whereConstraint) => Comment
  .findAll({ where: whereConstraint })
  .then(R.map(createCommentModel));

export const create = async (attributes) => Comment
  .create(attributes)
  .then(createCommentModel);
