export default (req, reply) => {
  return reply('OK');
  // 1. Validate input
  // 2. Check if password matches
  // 3. Check if user belongs to a network
  // 4. Create deviceId based on user agent
  // 5. Check if deviceId already exists or create new one
  // 6. Generate JWT token
  // 7. Generated refresh token
  // 8. Send data to Mixpanel
  // 9. Update last_login for user
  // 10. Return response
};
