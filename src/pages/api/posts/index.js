import pool from "../../../lib/db";
import { getServerSession } from "next-auth";

export default async function handler(req, res) {
  // Handle POST request - Create new post
  if (req.method === "POST") {
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

      // Return the complete post
      const post = {
        ...newPost,
        author: authorResult.rows[0],
        community: {
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
        },
        votes: [],
        comments: []
      };

      return res.status(201).json(post);
    } catch (error) {
      console.error("Create post error:", error);
      return res.status(500).json({ error: "Failed to create post: " + error.message });
    }
  }
  

  const { sort = "latest", communitySlug } = req.query;

// Build the WHERE clause for community filter
let communityFilter = "";
let queryParams = [];

if (communitySlug) {
  communityFilter = `WHERE c.slug = $1`;
  queryParams = [communitySlug];
}

  // Handle GET request - Fetch posts
  else if (req.method === "GET") {
    const { sort = "latest" } = req.query;

    try {
      let posts;
      
      if (sort === "latest") {
        // Fetch latest posts
const result = await pool.query(`
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
  ${communityFilter}
  ORDER BY p."createdAt" DESC
  LIMIT 50
`, queryParams);
        
        posts = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          imageUrl: row.imageUrl,
          linkUrl: row.linkUrl,
          type: row.type,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          communityId: row.communityId,
          authorId: row.authorId,
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
          comments: [],
          commentCount: parseInt(row.comment_count),
          voteScore: Array.isArray(row.votes) 
            ? row.votes.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0)
            : 0
        }));
        
        return res.status(200).json(posts);
        
      } else if (sort === "popular") {
        // Fetch posts sorted by vote score
        const result = await pool.query(`
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
            ) as comment_count,
            COALESCE(
              (SELECT COUNT(*) FROM "Vote" v WHERE v."postId" = p.id AND v.type = 'UP'), 0
            ) as upvotes,
            COALESCE(
              (SELECT COUNT(*) FROM "Vote" v WHERE v."postId" = p.id AND v.type = 'DOWN'), 0
            ) as downvotes
          FROM "Post" p
          JOIN "User" u ON p."authorId" = u.id
          JOIN "Community" c ON p."communityId" = c.id
          LIMIT 100
        `);
        
        // Calculate vote scores and sort
        const postsWithScores = result.rows.map(row => {
          const votes = row.votes || [];
          const voteScore = votes.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0);
          
          return {
            id: row.id,
            title: row.title,
            content: row.content,
            imageUrl: row.imageUrl,
            linkUrl: row.linkUrl,
            type: row.type,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            communityId: row.communityId,
            authorId: row.authorId,
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
            votes: votes,
            comments: [],
            commentCount: parseInt(row.comment_count),
            voteScore: voteScore,
            upvotes: parseInt(row.upvotes),
            downvotes: parseInt(row.downvotes)
          };
        });
        
        // Sort by vote score (highest first)
        posts = postsWithScores.sort((a, b) => b.voteScore - a.voteScore);
        
        return res.status(200).json(posts);
      } else {
        // Invalid sort parameter
        return res.status(400).json({ error: 'Invalid sort parameter. Use "latest" or "popular"' });
      }
      
    } catch (error) {
      console.error("Fetch posts error:", error);
      return res.status(500).json({ error: "Failed to fetch posts: " + error.message });
    }
  }
  
  // Handle other methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed. Use GET or POST` });
  }
}