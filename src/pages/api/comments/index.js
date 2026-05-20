import pool from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { postId, content } = req.body;
    const userId = token.id || token.sub;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO "Comment" (id, content, "postId", "authorId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW()) 
         RETURNING *`,
        [content.trim(), postId, userId]
      );

      const newComment = result.rows[0];
      
      const authorResult = await pool.query(
        `SELECT id, username, email FROM "User" WHERE id = $1`,
        [userId]
      );

      res.status(201).json({
        ...newComment,
        author: authorResult.rows[0]
      });
    } catch (error) {
      console.error("Comment error:", error);
      res.status(500).json({ error: "Failed to post comment" });
    }
  } 
  else if (req.method === "GET") {
    const { postId } = req.query;

    try {
      const result = await pool.query(
        `SELECT c.*, u.id as author_id, u.username as author_username, u.email as author_email
         FROM "Comment" c
         JOIN "User" u ON c."authorId" = u.id
         WHERE c."postId" = $1
         ORDER BY c."createdAt" DESC`,
        [postId]
      );
      
      const comments = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        postId: row.postId,
        authorId: row.authorId,
        author: {
          id: row.author_id,
          username: row.author_username,
          email: row.author_email,
        }
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