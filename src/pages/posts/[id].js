import { PrismaClient } from "@prisma/client";
import Layout from "../../components/Layout";
import VoteButtons from "../../components/VoteButtons";
import CommentSection from "../../components/CommentSection";
import TimeAgo from "react-time-ago";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const prisma = new PrismaClient();

export default function PostDetail({ post }) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        </div>
      </Layout>
    );
  }

  const voteScore = post.votes?.reduce((acc, vote) => {
    return acc + (vote.type === "UP" ? 1 : -1);
  }, 0) || 0;

  const userVote = session
    ? post.votes.find((v) => v.userId === session.user.id)?.type
    : null;

  const handleVoteUpdate = () => {
    router.replace(router.asPath);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="card">
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
                <a href={`/r/${post.community.slug}`} className="text-blue-500 hover:underline ml-1">
                  r/{post.community.name}
                </a>
                {" • by u/"}
                <a href={`/user/${post.author.username}`} className="hover:text-blue-500">
                  {post.author.username}
                </a>
                {" • "}
                <TimeAgo date={new Date(post.createdAt)} locale="en-US" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
              
              {post.type === "text" && (
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                </div>
              )}
              
              {post.type === "image" && post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="max-w-full rounded-lg mb-4" />
              )}
              
              {post.type === "link" && post.linkUrl && (
                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-500 hover:underline mb-4 block">
                  {post.linkUrl}
                </a>
              )}
            </div>
          </div>
        </div>
        
        <CommentSection postId={post.id} initialComments={post.comments} />
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      community: true,
      votes: true,
      comments: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return {
    props: {
      post: JSON.parse(JSON.stringify(post)),
    },
  };
}