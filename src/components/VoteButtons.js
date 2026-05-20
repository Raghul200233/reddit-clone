import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function VoteButtons({ postId, initialScore, userVote: initialUserVote, onVoteUpdate }) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore || 0);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (type) => {
    if (!session) {
      toast.error("Please login to vote");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });

      if (!res.ok) throw new Error("Failed to vote");

      const data = await res.json();
      
      setScore(data.score);
      setUserVote(data.userVote);
      
      if (onVoteUpdate) {
        onVoteUpdate(data.score, data.userVote);
      }
    } catch (error) {
      toast.error("Failed to vote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row md:flex-col items-center gap-1 md:gap-0.5">
      <button
        onClick={() => handleVote("UP")}
        disabled={!session || loading}
        className={`vote-button text-lg md:text-xl font-bold transition-all duration-150 ${
          !session ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } ${
          userVote === "UP" ? "vote-button-active-up" : "text-gray-400 hover:text-[#FF4500]"
        }`}
        title={!session ? "Login to vote" : "Upvote"}
      >
        ▲
      </button>
      <span className={`text-xs md:text-sm font-semibold my-0.5 ${score > 0 ? 'text-[#FF4500]' : score < 0 ? 'text-[#7193FF]' : 'text-gray-500'}`}>
        {score}
      </span>
      <button
        onClick={() => handleVote("DOWN")}
        disabled={!session || loading}
        className={`vote-button text-lg md:text-xl font-bold transition-all duration-150 ${
          !session ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } ${
          userVote === "DOWN" ? "vote-button-active-down" : "text-gray-400 hover:text-[#7193FF]"
        }`}
        title={!session ? "Login to vote" : "Downvote"}
      >
        ▼
      </button>
    </div>
  );
} 