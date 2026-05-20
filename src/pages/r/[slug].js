import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import PostCard from "../../components/PostCard";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SkeletonLoader from "../../components/SkeletonLoader";

export default function CommunityPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchCommunity();
      fetchPosts();
    }
  }, [slug, sortBy]);

  const fetchCommunity = async () => {
    try {
      const res = await fetch(`/api/communities?slug=${slug}`);
      if (!res.ok) throw new Error("Community not found");
      const data = await res.json();
      setCommunity(data);
    } catch (error) {
      console.error("Error fetching community:", error);
      setError("Community not found");
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?sort=${sortBy}&communitySlug=${slug}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      console.log("Fetched posts for community:", slug, data);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const handleVoteUpdate = (postId, newScore, userVote) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, voteScore: newScore, userVote }
          : post
      )
    );
  };

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Community not found</h1>
          <Link href="/" className="text-[#FF4500] hover:underline">
            Go home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h1 className="text-2xl font-bold mb-2">
            r/{community?.name || slug}
          </h1>
          {community?.description && (
            <p className="text-gray-600">{community.description}</p>
          )}
          {session && (
            <Link
              href={`/r/${slug}/create-post`}
              className="inline-block mt-4 bg-[#FF4500] text-white px-4 py-2 rounded-full hover:bg-[#FF5722] transition-colors"
            >
              Create Post
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-white rounded-lg border border-gray-200 p-2">
        <button
          onClick={() => handleSortChange("latest")}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            sortBy === "latest"
              ? "bg-[#FF4500] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          📅 Latest
        </button>
        <button
          onClick={() => handleSortChange("popular")}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            sortBy === "popular"
              ? "bg-[#FF4500] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔥 Popular
        </button>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">No posts yet in this community</p>
          {session ? (
            <Link
              href={`/r/${slug}/create-post`}
              className="inline-block bg-[#FF4500] text-white px-6 py-2 rounded-full hover:bg-[#FF5722] transition-colors"
            >
              Create First Post
            </Link>
          ) : (
            <p className="text-gray-400">Login to create the first post!</p>
          )}
        </div>
      ) : (
        posts.map((post) => (
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