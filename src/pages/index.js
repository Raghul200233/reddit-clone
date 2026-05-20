import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Home() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts on component mount and when sort changes
  useEffect(() => {
    fetchPosts();
    fetchCommunities();
  }, [sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching posts with sort: ${sortBy}`);
      const res = await fetch(`/api/posts?sort=${sortBy}`);
      
      console.log(`Response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`HTTP error! status: ${res.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`Fetched ${data.length} posts:`, data);
      
      if (!Array.isArray(data)) {
        console.error("API didn't return an array:", data);
        setPosts([]);
      } else {
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError("Failed to load posts. Please refresh the page.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) throw new Error("Failed to fetch communities");
      const data = await res.json();
      setCommunities(data);
    } catch (error) {
      console.error("Failed to fetch communities:", error);
    }
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const handleVoteUpdate = (postId, newScore, userVote) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              voteScore: newScore,
              userVote: userVote
            }
          : post
      )
    );
  };

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchPosts} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Sort buttons */}
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
          
          {/* Posts list - Using SkeletonLoader component */}
          {loading ? (
            <SkeletonLoader />
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">No posts yet</p>
              <p className="text-gray-400 mb-6">Be the first to create a post!</p>
              {session && (
                <Link href="/create-community" className="inline-block bg-[#FF4500] text-white px-6 py-2 rounded-full hover:bg-[#FF5722] transition-colors">
                  Create a Community
                </Link>
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
        </div>
        
        {/* Sidebar - Top Communities */}
        <div className="lg:w-80">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
            <h3 className="font-semibold text-lg mb-3">Top Communities</h3>
            {communities.length === 0 ? (
              <div className="space-y-2">
                <div className="skeleton h-8 rounded"></div>
                <div className="skeleton h-8 rounded"></div>
                <div className="skeleton h-8 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {communities.slice(0, 10).map((community, index) => (
                  <Link
                    key={community.id}
                    href={`/r/${community.slug}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-gray-900 group-hover:text-[#FF4500] transition-colors">
                      r/{community.name}
                    </span>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </Link>
                ))}
              </div>
            )}
            {session && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link 
                  href="/create-community" 
                  className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  + Create Community
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}