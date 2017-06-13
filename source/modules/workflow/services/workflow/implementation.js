const R = require('ramda');
const dateUtils = require('../../../../shared/utils/date');

const findIdInArray = (id, arr) => R.find(R.propEq('id', id), arr);
const findChildren = (workflowId) => R.filter(R.propEq('workflowId', workflowId));
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

/**
 * Add data to each worflow
 * @param {Array<Object>} commentCounts - Amount of comments for all workflows
 * @param {Array<Object>} likeCounts - Amount of likes for all workflows
 * @param {Array<Object>} seenCounts - Amount of views for all workflows
 * @param {Array<Action>} allAcounts - Actions for all workflows
 * @param {Array<Trigger>} allTriggers - Triggers for all workflows
 * @param {Object<Workflow>} workflow - The workflow to add data to
 * @method addExtraData
 * @return {Object<Workflow>}
**/
const addExtraData = R.curry((
  commentCounts, likeCounts, seenCounts, allActions, allTriggers, workflow
) => {
  const commentsCountRes = findIdInArray(workflow.id, commentCounts);
  const likesCountRes = findIdInArray(workflow.id, likeCounts);
  const seenCountRes = findIdInArray(workflow.id, seenCounts);
  const actions = findChildren(workflow.id)(allActions);
  const triggers = findChildren(workflow.id)(allTriggers);

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
    triggers,
    likesCount,
    commentsCount,
    lastInteraction,
  });
});

exports.addExtraData = addExtraData;
