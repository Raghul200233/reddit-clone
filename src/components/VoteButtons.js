import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function VoteButtons({ postId, initialScore, userVote: initialUserVote, onVoteUpdate }) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore || 0);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (type) => {
    console.log("Vote clicked:", { type, sessionExists: !!session });
    
    if (!session) {
      toast.error("Please login to vote");
      return;
    }

    if (loading) {
      console.log("Vote already in progress");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Sending vote request:", { postId, type });
      
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });

      console.log("Vote response status:", res.status);
      
      const data = await res.json();
      console.log("Vote response data:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to vote");
      }

      setScore(data.score);
      setUserVote(data.userVote);
      
      if (onVoteUpdate) {
        onVoteUpdate(data.score, data.userVote);
      }
      
      toast.success(data.userVote ? "Vote recorded!" : "Vote removed!");
      
    } catch (error) {
      console.error("Vote error:", error);
      toast.error(error.message || "Failed to vote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[40px]">
      <button
        onClick={() => handleVote("UP")}
        disabled={!session || loading}
        className={`text-xl font-bold transition-all duration-150 ${
          !session ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } ${
          userVote === "UP" 
            ? "text-[#FF4500]" 
            : "text-gray-400 hover:text-[#FF4500]"
        }`}
        title={!session ? "Login to vote" : "Upvote"}
      >
        ▲
      </button>
      
      <span className={`text-sm font-semibold ${score > 0 ? 'text-[#FF4500]' : score < 0 ? 'text-[#7193FF]' : 'text-gray-600'}`}>
        {score}
      </span>
      
      <button
        onClick={() => handleVote("DOWN")}
        disabled={!session || loading}
        className={`text-xl font-bold transition-all duration-150 ${
          !session ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } ${
          userVote === "DOWN" 
            ? "text-[#7193FF]" 
            : "text-gray-400 hover:text-[#7193FF]"
        }`}
        title={!session ? "Login to vote" : "Downvote"}
      >
        ▼
      </button>
    </div>
  );
}