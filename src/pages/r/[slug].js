import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import PostCard from "../../components/PostCard";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default function CommunityPage({ community, initialPosts }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [sortBy, setSortBy] = useState("latest");

  if (!community) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Community not found</h1>
          <Link href="/" className="text-blue-500 hover:underline">
            Go home
          </Link>
        </div>
      </Layout>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      const scoreA = a.votes?.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0) || 0;
      const scoreB = b.votes?.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0) || 0;
      return scoreB - scoreA;
    }
  });

  const handleVoteUpdate = (postId, newScore, userVote) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, votes: [{ type: userVote }], userVote }
          : post
      )
    );
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="card">
          <h1 className="text-3xl font-bold mb-2">r/{community.name}</h1>
          {community.description && (
            <p className="text-gray-600">{community.description}</p>
          )}
          {session && (
            <Link
              href={`/r/${community.slug}/create-post`}
              className="inline-block mt-4 btn-primary"
            >
              Create Post
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy("latest")}
          className={`px-4 py-2 rounded-lg ${
            sortBy === "latest"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Latest
        </button>
        <button
          onClick={() => setSortBy("popular")}
          className={`px-4 py-2 rounded-lg ${
            sortBy === "popular"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Popular
        </button>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onVoteUpdate={(score, userVote) => handleVoteUpdate(post.id, score, userVote)}
          />
        ))
      )}
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
  });

  if (!community) {
    return { props: { community: null, initialPosts: [] } };
  }

  const posts = await prisma.post.findMany({
    where: { communityId: community.id },
    include: {
      author: true,
      community: true,
      votes: true,
      comments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      community: JSON.parse(JSON.stringify(community)),
      initialPosts: JSON.parse(JSON.stringify(posts)),
    },
  };
}