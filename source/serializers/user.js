import formatDate from 'utils/formatDate';

export default item => {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

  return {
    type: 'user',
    id: item.id.toString(),
    first_name: item.firstName,
    last_name: item.lastName,
    full_name: `${item.firstName} ${item.lastName || ''}`,
    email: item.email,
    phone_num: item.phone_num,
    profile_img: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${item.profileImg}`,
    created_at: formatDate(item.created_at),
  };
};
