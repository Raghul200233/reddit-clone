import Link from "next/link";
import VoteButtons from "./VoteButtons";
import TimeAgo from "react-time-ago";
import { useState } from "react";

export default function PostCard({ post, onVoteUpdate }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const voteScore = post.voteScore !== undefined 
    ? post.voteScore 
    : post.votes?.reduce((acc, vote) => acc + (vote.type === "UP" ? 1 : -1), 0) || 0;

  const commentCount = post.commentCount || post.comments?.length || 0;

  return (
    <div className="reddit-card hover:shadow-md transition-all duration-200">
      <div className="p-3">
        <div className="flex gap-2">
          {/* Vote Section */}
          <div className="flex-shrink-0">
            <VoteButtons
              postId={post.id}
              initialScore={voteScore}
              userVote={post.userVote}
              onVoteUpdate={onVoteUpdate}
            />
          </div>
          
          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Community and metadata */}
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 flex-wrap">
              <Link 
                href={`/r/${post.community.slug}`} 
                className="font-medium text-gray-900 hover:text-[#FF4500]"
              >
                r/{post.community.name}
              </Link>
              <span>•</span>
              <span>Posted by u/
                <Link href={`/user/${post.author.username}`} className="hover:text-[#FF4500]">
                  {post.author.username}
                </Link>
              </span>
              <span>•</span>
              <TimeAgo date={new Date(post.createdAt)} locale="en-US" />
            </div>
            
            {/* Title - Clickable */}
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2 hover:text-[#FF4500] hover:underline transition-colors">
                {post.title}
              </h2>
            </Link>
            
            {/* Content preview */}
            {post.type === "text" && post.content && (
              <div className="text-gray-700 text-sm mb-2 line-clamp-3 whitespace-pre-wrap">
                {post.content.substring(0, 300)}
                {post.content.length > 300 && "..."}
              </div>
            )}
            
            {post.type === "image" && post.imageUrl && (
              <div className="mb-2 relative">
                {!imageLoaded && (
                  <div className="skeleton w-full h-48 rounded-lg"></div>
                )}
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className={`max-h-96 w-auto rounded-lg object-contain ${!imageLoaded ? 'hidden' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                    setImageLoaded(true);
                  }}
                />
              </div>
            )}
            
            {post.type === "link" && post.linkUrl && (
              <a 
                href={post.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline mb-2 block text-sm break-all"
              >
                🔗 {post.linkUrl}
              </a>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <Link 
                href={`/posts/${post.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FF4500] transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{commentCount} Comments</span>
              </Link>
              
              <button className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FF4500] transition-colors px-3 py-1.5 rounded-full hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}