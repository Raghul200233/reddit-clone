import pool from "../../../lib/db";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, {});

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { postId, type } = req.body;

  try {
    // Check if vote exists
    const existingVote = await pool.query(
      `SELECT * FROM "Vote" WHERE "userId" = $1 AND "postId" = $2`,
      [session.user.id, postId]
    );

    if (existingVote.rows.length > 0) {
      const existing = existingVote.rows[0];
      if (existing.type === type) {
        // Remove vote
        await pool.query(`DELETE FROM "Vote" WHERE id = $1`, [existing.id]);
      } else {
        // Update vote
        await pool.query(`UPDATE "Vote" SET type = $1 WHERE id = $2`, [type, existing.id]);
      }
    } else {
      // Create vote
      await pool.query(
        `INSERT INTO "Vote" (id, type, "userId", "postId") VALUES (gen_random_uuid()::text, $1, $2, $3)`,
        [type, session.user.id, postId]
      );
    }

    // Get updated vote counts
    const votesResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN type = 'UP' THEN 1 END) as upvotes,
        COUNT(CASE WHEN type = 'DOWN' THEN 1 END) as downvotes
       FROM "Vote" WHERE "postId" = $1`,
      [postId]
    );
    
    const upvotes = parseInt(votesResult.rows[0].upvotes) || 0;
    const downvotes = parseInt(votesResult.rows[0].downvotes) || 0;
    const score = upvotes - downvotes;

    // Get user's current vote
    const userVoteResult = await pool.query(
      `SELECT type FROM "Vote" WHERE "userId" = $1 AND "postId" = $2`,
      [session.user.id, postId]
    );

    res.status(200).json({ 
      score, 
      upvotes,
      downvotes,
      userVote: userVoteResult.rows[0]?.type || null 
    });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ error: "Failed to process vote" });
  }
}