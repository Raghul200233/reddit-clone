import pool from "../../../lib/db";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!id) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  try {
    // Fetch single post with author and community details
    const result = await pool.query(
      `
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
          (SELECT json_agg(
            json_build_object(
              'id', cm.id, 
              'content', cm.content, 
              'createdAt', cm."createdAt",
              'authorId', cm."authorId",
              'author', json_build_object('id', au.id, 'username', au.username, 'email', au.email)
            ) ORDER BY cm."createdAt" DESC
          ) FROM "Comment" cm 
          LEFT JOIN "User" au ON cm."authorId" = au.id
          WHERE cm."postId" = p.id),
          '[]'::json
        ) as comments
      FROM "Post" p
      JOIN "User" u ON p."authorId" = u.id
      JOIN "Community" c ON p."communityId" = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const row = result.rows[0];
    
    const post = {
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
      comments: row.comments || [],
      voteScore: Array.isArray(row.votes) 
        ? row.votes.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0)
        : 0
    };

    res.status(200).json(post);
  } catch (error) {
    console.error("Fetch post error:", error);
    res.status(500).json({ error: "Failed to fetch post: " + error.message });
  }
}