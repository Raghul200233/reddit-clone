import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  res.status(200).json({
    hasToken: !!token,
    tokenUserId: token?.id || token?.sub,
    tokenEmail: token?.email,
    tokenUsername: token?.username,
    fullToken: token
  });
}