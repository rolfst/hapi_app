const R = require('ramda');
const dateUtils = require('../../../../shared/utils/date');

const findIdInArray = (id, arr) => R.find(R.propEq('id', id), arr);
const findActions = (workflowId) => R.filter(R.propEq('workflowId', workflowId));
const getLastInteraction = (likesCountRes, commentsCountRes) => {
  const lastLikeActivity = likesCountRes ? likesCountRes.lastLikeActivity : null;
  const lastCommentActivity = commentsCountRes ? commentsCountRes.lastCommentActivity : null;

  if (!lastLikeActivity && !lastCommentActivity) return null;

  let retVal;

  if (!lastLikeActivity) retVal = lastCommentActivity;
  if (!lastCommentActivity) retVal = lastLikeActivity;
  if (lastLikeActivity && lastCommentActivity) {
    retVal = lastCommentActivity > lastLikeActivity
      ? lastCommentActivity
      : lastLikeActivity;
  }

  return dateUtils.toISOString(retVal);
};

const addExtraData = R.curry((
  [workflowCommentCounts, workflowLikeCounts, workflowSeenCounts, workflowActions],
  workflow
) => {
  const commentsCountRes = findIdInArray(workflow.id, workflowCommentCounts);
  const likesCountRes = findIdInArray(workflow.id, workflowLikeCounts);
  const seenCountRes = findIdInArray(workflow.id, workflowSeenCounts);
  const actions = findActions(workflow.id)(workflowActions);

  const reachCount = (workflow.meta && workflow.meta.reachCount) ?
    workflow.meta.reachCount : null;

  const seenCount = seenCountRes ? seenCountRes.seenCount : 0;
  const likesCount = likesCountRes ? likesCountRes.likesCount : 0;
  const commentsCount = commentsCountRes ? commentsCountRes.commentsCount : 0;
  const lastInteraction = getLastInteraction(likesCountRes, commentsCountRes);

  return R.merge(workflow, {
    reachCount,
    seenCount,
    actions,
    likesCount,
    commentsCount,
    lastInteraction,
  });
});

exports.addExtraData = addExtraData;
