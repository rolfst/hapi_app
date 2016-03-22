export default item => {
  return {
    type: item.type,
    id: item.id.toString(),
    first_name: item.firstName,
    last_name: item.lastName,
    email: item.email,
    profile_img: item.profileImg,
    created_at: item.created_at,
  };
};
