import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "timeago.js";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CommentSection({ postId, initialComments = [], onCommentAdded }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(true);

  // Fetch comments if not provided as props
  useEffect(() => {
    if (initialComments.length === 0 && postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

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

  const handleReply = async (parentCommentId) => {
    if (!session) {
      toast.error("Please login to reply");
      return;
    }
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postId, 
          content: replyContent,
          parentId: parentCommentId 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post reply");
      }

      const comment = await res.json();
      // Add reply to the parent comment's replies
      setComments(prevComments => 
        prevComments.map(c => 
          c.id === parentCommentId 
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        )
      );
      setReplyContent("");
      setReplyTo(null);
      toast.success("Reply posted!");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Reply error:", error);
      toast.error(error.message || "Failed to post reply");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success("Comment deleted");
        if (onCommentAdded) onCommentAdded();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete comment");
    }
  };

  const formatDate = (date) => {
    try {
      return format(date);
    } catch {
      return "recently";
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        💬 Comments
        <span className="text-sm text-gray-500 font-normal">
          ({comments.length})
        </span>
      </h3>
      
      {/* Comment Form */}
      {session && showCommentForm ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent resize-none"
              rows="3"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowCommentForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-[#FF4500] text-white rounded-full text-sm font-medium hover:bg-[#FF5722] transition-colors disabled:opacity-50"
              >
                {loading ? "Posting..." : "Comment"}
              </button>
            </div>
          </form>
        </div>
      ) : session && !showCommentForm && (
        <button
          onClick={() => setShowCommentForm(true)}
          className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          + Add a comment
        </button>
      )}

      {!session && (
        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
          <p className="text-gray-600">
            <Link href="/login" className="text-[#FF4500] hover:underline">
              Log in
            </Link>{" "}
            to join the discussion
          </p>
        </div>
      )}
      
      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#FF4500] to-[#FF5722] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {comment.author?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <Link 
                      href={`/user/${comment.author?.username}`}
                      className="font-semibold text-gray-900 hover:text-[#FF4500] text-sm"
                    >
                      u/{comment.author?.username}
                    </Link>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
                
                {/* Delete button for own comments */}
                {session?.user?.id === comment.authorId && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Comment Content */}
              <div className="ml-10">
                <p className="text-gray-800 text-sm whitespace-pre-wrap mb-2">
                  {comment.content}
                </p>
                
                {/* Reply Button */}
                {session && (
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-xs text-gray-500 hover:text-[#FF4500] transition-colors"
                  >
                    {replyTo === comment.id ? "Cancel" : "Reply"}
                  </button>
                )}
                
                {/* Reply Form */}
                {replyTo === comment.id && (
                  <div className="mt-3 ml-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to u/${comment.author?.username}...`}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF4500] resize-none"
                      rows="2"
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => setReplyTo(null)}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-[#FF4500] text-white rounded-full text-xs font-medium hover:bg-[#FF5722] transition-colors disabled:opacity-50"
                      >
                        {loading ? "Posting..." : "Reply"}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-200 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {reply.author?.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <Link 
                            href={`/user/${reply.author?.username}`}
                            className="font-semibold text-gray-900 hover:text-[#FF4500] text-xs"
                          >
                            u/{reply.author?.username}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm ml-8">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}