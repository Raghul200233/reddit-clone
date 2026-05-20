import pool from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        COUNT(p.id) as "postCount"
      FROM "Community" c
      LEFT JOIN "Post" p ON c.id = p."communityId"
      WHERE c.name ILIKE $1 OR c.description ILIKE $1
      GROUP BY c.id
      ORDER BY "postCount" DESC
      LIMIT 10`,
      [`%${q}%`]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search communities" });
  }
}