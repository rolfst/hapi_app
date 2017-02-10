
export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.payload };
  
  reply();
 } catch (err) {
   reply(err);
 }
}
