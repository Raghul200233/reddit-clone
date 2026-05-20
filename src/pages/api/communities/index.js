import pool from "../../../lib/db";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  // Handle POST - Create new community
  if (req.method === "POST") {
    const session = await getServerSession(req, res, {});

    if (!session) {
      return res.status(401).json({ error: "Unauthorized - Please login" });
    }

    const { name, description } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Community name is required" });
    }

    // Validate community name format (only letters, numbers, underscores, hyphens)
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: "Community name can only contain letters, numbers, underscores, and hyphens" });
    }

    const slug = name.toLowerCase().trim();

    try {
      // Check if community already exists
      const existingCommunity = await pool.query(
        `SELECT * FROM "Community" WHERE name = $1 OR slug = $2`,
        [name, slug]
      );

      if (existingCommunity.rows.length > 0) {
        return res.status(400).json({ error: "Community already exists" });
      }

      // Create the community
      const result = await pool.query(
        `INSERT INTO "Community" (id, name, slug, description, "createdAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW()) 
         RETURNING *`,
        [name.trim(), slug, description || null]
      );

      const newCommunity = result.rows[0];
      res.status(201).json(newCommunity);
    } catch (error) {
      console.error("Create community error:", error);
      res.status(500).json({ error: "Failed to create community: " + error.message });
    }
  }
  
  // Handle GET - Fetch communities
  else if (req.method === "GET") {
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
          `SELECT c.*, COUNT(p.id) as "postCount"
           FROM "Community" c
           LEFT JOIN "Post" p ON c.id = p."communityId"
           GROUP BY c.id
           ORDER BY "postCount" DESC
           LIMIT 20`
        );
        return res.status(200).json(result.rows);
      }
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch communities" });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}