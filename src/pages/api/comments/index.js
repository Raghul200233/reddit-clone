import pool from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (req.method === "POST") {
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { postId, content, parentId } = req.body;
    const userId = token.id || token.sub;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO "Comment" (id, content, "postId", "authorId", "parentId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) 
         RETURNING *`,
        [content.trim(), postId, userId, parentId || null]
      );

      const newComment = result.rows[0];
      
      // Get author info
      const authorResult = await pool.query(
        `SELECT id, username, email FROM "User" WHERE id = $1`,
        [userId]
      );

      res.status(201).json({
        ...newComment,
        author: authorResult.rows[0],
        replies: []
      });
    } catch (error) {
      console.error("Comment error:", error);
      res.status(500).json({ error: "Failed to post comment" });
    }
  } 
  else if (req.method === "GET") {
    const { postId } = req.query;

    try {
      // Get top-level comments first
      const result = await pool.query(
        `SELECT c.*, u.id as author_id, u.username as author_username, u.email as author_email
         FROM "Comment" c
         JOIN "User" u ON c."authorId" = u.id
         WHERE c."postId" = $1 AND (c."parentId" IS NULL OR c."parentId" = '')
         ORDER BY c."createdAt" DESC`,
        [postId]
      );
      
      const comments = await Promise.all(result.rows.map(async (row) => {
        // Get replies for each comment
        const repliesResult = await pool.query(
          `SELECT c.*, u.id as author_id, u.username as author_username, u.email as author_email
           FROM "Comment" c
           JOIN "User" u ON c."authorId" = u.id
           WHERE c."parentId" = $1
           ORDER BY c."createdAt" ASC`,
          [row.id]
        );
        
        return {
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          postId: row.postId,
          authorId: row.authorId,
          parentId: row.parentId,
          author: {
            id: row.author_id,
            username: row.author_username,
            email: row.author_email,
          },
          replies: repliesResult.rows.map(reply => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            author: {
              id: reply.author_id,
              username: reply.author_username,
              email: reply.author_email,
            }
          }))
        };
      }));
      
      res.status(200).json(comments);
    } catch (error) {
      console.error("Fetch comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}