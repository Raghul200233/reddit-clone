import pool from "../../../lib/db";

export default async function handler(req, res) {
  // Handle POST request - Create new post
  if (req.method === "POST") {
    const { getServerSession } = require("next-auth");
    const session = await getServerSession(req, res, {});

    if (!session) {
      return res.status(401).json({ error: "Unauthorized - Please login" });
    }

    const userId = session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in session" });
    }

    const { title, content, imageUrl, linkUrl, type, communitySlug } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!communitySlug) {
      return res.status(400).json({ error: "Community is required" });
    }

    try {
      // Find the community
      const communityResult = await pool.query(
        `SELECT * FROM "Community" WHERE slug = $1`,
        [communitySlug]
      );

      if (communityResult.rows.length === 0) {
        return res.status(404).json({ error: "Community not found" });
      }

      const community = communityResult.rows[0];

      // Create the post
      const postResult = await pool.query(
        `INSERT INTO "Post" (id, title, content, "imageUrl", "linkUrl", type, "communityId", "authorId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         RETURNING *`,
        [title.trim(), content || "", imageUrl || null, linkUrl || null, type || "text", community.id, userId]
      );

      const newPost = postResult.rows[0];

      // Get author info
      const authorResult = await pool.query(
        `SELECT id, username, email FROM "User" WHERE id = $1`,
        [userId]
      );

      res.status(201).json({
        ...newPost,
        author: authorResult.rows[0],
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
        },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post: " + error.message });
    }
  }
  
  // Handle GET request - Fetch posts
  else if (req.method === "GET") {
    const { sort = "latest", communitySlug } = req.query;

    try {
      let query = `
        SELECT 
          p.*,
          u.id as author_id,
          u.username as author_username,
          u.email as author_email,
          c.id as community_id,
          c.name as community_name,
          c.slug as community_slug,
          c.description as community_description,
          COALESCE(
            (SELECT json_agg(json_build_object('type', v.type, 'userId', v."userId")) 
             FROM "Vote" v WHERE v."postId" = p.id),
            '[]'::json
          ) as votes,
          COALESCE(
            (SELECT COUNT(*) FROM "Comment" cm WHERE cm."postId" = p.id),
            0
          ) as comment_count
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        JOIN "Community" c ON p."communityId" = c.id
      `;

      let params = [];

      // Add community filter if provided
      if (communitySlug) {
        query += ` WHERE c.slug = $1`;
        params.push(communitySlug);
      }

      // Add ordering
      if (sort === "latest") {
        query += ` ORDER BY p."createdAt" DESC`;
      } else {
        query += ` ORDER BY p."createdAt" DESC`; // Will sort by vote score in JS
      }

      query += ` LIMIT 50`;

      const result = await pool.query(query, params);
      
      // Transform the data
      let posts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        imageUrl: row.imageUrl,
        linkUrl: row.linkUrl,
        type: row.type,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
          id: row.author_id,
          username: row.author_username,
          email: row.author_email,
        },
        community: {
          id: row.community_id,
          name: row.community_name,
          slug: row.community_slug,
          description: row.community_description,
        },
        votes: row.votes || [],
        commentCount: parseInt(row.comment_count),
        voteScore: Array.isArray(row.votes) 
          ? row.votes.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0)
          : 0
      }));

      // Sort by vote score for popular
      if (sort === "popular") {
        posts = posts.sort((a, b) => b.voteScore - a.voteScore);
      }
      
      console.log(`Returning ${posts.length} posts for ${communitySlug || 'all communities'}`);
      res.status(200).json(posts);
    } catch (error) {
      console.error("Fetch posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts: " + error.message });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}