import pool from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(`
      SELECT * FROM "Community" 
      ORDER BY "createdAt" DESC 
      LIMIT 20
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch communities" });
  }
}