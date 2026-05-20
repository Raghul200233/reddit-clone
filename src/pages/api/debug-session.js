import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, {});
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  res.status(200).json({
    hasSession: !!session,
    session: session,
    token: token,
    userId: session?.user?.id || token?.id || token?.sub,
  });
}