export default (dao) => ({
  id: dao.id.toString(),
  text: dao.text,
  vote_count: dao.Votes ? dao.Votes.length : 0,
});
