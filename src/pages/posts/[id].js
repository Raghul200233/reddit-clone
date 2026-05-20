import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import VoteButtons from "../../components/VoteButtons";
import CommentSection from "../../components/CommentSection";
import TimeAgo from "react-time-ago";
import { useSession } from "next-auth/react";

export default function PostDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Post not found");
        throw new Error("Failed to fetch post");
      }
      const data = await res.json();
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteUpdate = () => {
    fetchPost(); // Refresh post after vote
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">
            {error === "Post not found" ? "Post Not Found" : "Error Loading Post"}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === "Post not found" 
              ? "The post you're looking for doesn't exist or has been deleted."
              : "There was an error loading this post. Please try again."}
          </p>
          <button 
            onClick={() => router.push("/")}
            className="inline-block bg-[#FF4500] text-white px-6 py-2 rounded-full hover:bg-[#FF5722]"
          >
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  const voteScore = post.votes?.reduce((acc, vote) => {
    return acc + (vote.type === "UP" ? 1 : -1);
  }, 0) || 0;

  const userVote = session
    ? post.votes?.find((v) => v.userId === session.user.id)?.type
    : null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex gap-4">
            <VoteButtons
              postId={post.id}
              initialScore={voteScore}
              userVote={userVote}
              onVoteUpdate={handleVoteUpdate}
            />
            
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-2">
                Posted in
                <a href={`/r/${post.community.slug}`} className="text-[#FF4500] hover:underline ml-1">
                  r/{post.community.name}
                </a>
                {" • by u/"}
                <a href={`/user/${post.author.username}`} className="hover:text-[#FF4500]">
                  {post.author.username}
                </a>
                {" • "}
                <TimeAgo date={new Date(post.createdAt)} locale="en-US" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              
              {post.type === "text" && (
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                </div>
              )}
              
              {post.type === "image" && post.imageUrl && (
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="max-w-full rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                  }}
                />
              )}
              
              {post.type === "link" && post.linkUrl && (
                <a 
                  href={post.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline mb-4 inline-block"
                >
                  🔗 {post.linkUrl}
                </a>
              )}
            </div>
          </div>
        </div>
        
        <CommentSection postId={post.id} initialComments={post.comments || []} />
      </div>
    </Layout>
  );
}