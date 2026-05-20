import { useState } from "react";
import { useSession } from "next-auth/react";
import TimeAgo from "react-time-ago";
import toast from "react-hot-toast";

export default function CommentSection({ postId, initialComments, onCommentAdded }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to comment");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: newComment }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post comment");
      }

      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Comment posted!");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Comment error:", error);
      toast.error(error.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">
        Comments ({comments.length})
      </h3>
      
      {session && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
            rows="3"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#FF4500] text-white px-4 py-2 rounded-full font-medium hover:bg-[#FF5722] transition-colors disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      )}
      
      {!session && (
        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
          <p className="text-gray-600">
            <a href="/login" className="text-[#FF4500] hover:underline">
              Log in
            </a> to join the discussion
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-2">
                <span className="font-semibold text-gray-700">u/{comment.author?.username || "unknown"}</span>
                {" • "}
                {comment.createdAt && <TimeAgo date={new Date(comment.createdAt)} locale="en-US" />}
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}