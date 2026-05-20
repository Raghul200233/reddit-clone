import pool from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get user from token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  console.log("Vote API - Token:", token ? "Exists" : "Missing");
  
  if (!token) {
    return res.status(401).json({ error: "Please login to vote" });
  }

  const userId = token.id || token.sub;
  console.log("Vote API - User ID:", userId);

  if (!userId) {
    return res.status(401).json({ error: "User ID not found" });
  }

  const { postId, type } = req.body;

  if (!postId || !type) {
    return res.status(400).json({ error: "Post ID and vote type are required" });
  }

  if (type !== "UP" && type !== "DOWN") {
    return res.status(400).json({ error: "Vote type must be UP or DOWN" });
  }

  try {
    // Check if vote already exists
    const existingVote = await pool.query(
      `SELECT * FROM "Vote" WHERE "userId" = $1 AND "postId" = $2`,
      [userId, postId]
    );

    let result;
    
    if (existingVote.rows.length > 0) {
      const existing = existingVote.rows[0];
      
      if (existing.type === type) {
        // Same vote type - remove vote
        await pool.query(`DELETE FROM "Vote" WHERE id = $1`, [existing.id]);
        result = { action: "removed", type: null };
      } else {
        // Different vote type - update vote
        await pool.query(`UPDATE "Vote" SET type = $1 WHERE id = $2`, [type, existing.id]);
        result = { action: "updated", type: type };
      }
    } else {
      // Create new vote
      await pool.query(
        `INSERT INTO "Vote" (id, type, "userId", "postId") 
         VALUES (gen_random_uuid()::text, $1, $2, $3)`,
        [type, userId, postId]
      );
      result = { action: "created", type: type };
    }

    // Get updated vote counts
    const voteCounts = await pool.query(
      `SELECT 
        COUNT(CASE WHEN type = 'UP' THEN 1 END) as upvotes,
        COUNT(CASE WHEN type = 'DOWN' THEN 1 END) as downvotes
       FROM "Vote" 
       WHERE "postId" = $1`,
      [postId]
    );

    const upvotes = parseInt(voteCounts.rows[0].upvotes) || 0;
    const downvotes = parseInt(voteCounts.rows[0].downvotes) || 0;
    const score = upvotes - downvotes;

    // Get user's current vote (after changes)
    const userVoteResult = await pool.query(
      `SELECT type FROM "Vote" WHERE "userId" = $1 AND "postId" = $2`,
      [userId, postId]
    );

    const userVote = userVoteResult.rows[0]?.type || null;

    console.log("Vote API - Success:", { score, userVote, upvotes, downvotes });

    return res.status(200).json({ 
      success: true,
      score, 
      userVote,
      upvotes,
      downvotes
    });
    
  } catch (error) {
    console.error("Vote API Error:", error);
    return res.status(500).json({ error: "Failed to process vote: " + error.message });
  }
}