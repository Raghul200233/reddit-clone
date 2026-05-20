import pool from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { slug } = req.query;

    try {
      if (slug) {
        // Fetch single community by slug
        const result = await pool.query(
          `SELECT * FROM "Community" WHERE slug = $1`,
          [slug]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Community not found" });
        }
        
        return res.status(200).json(result.rows[0]);
      } else {
        // Fetch all communities
        const result = await pool.query(
          `SELECT * FROM "Community" ORDER BY "createdAt" DESC LIMIT 20`
        );
        return res.status(200).json(result.rows);
      }
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch communities" });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}