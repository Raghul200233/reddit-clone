import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        community: true,
        votes: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch posts" });
  } finally {
    await prisma.$disconnect();
  }
}