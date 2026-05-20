import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import toast from "react-hot-toast";

export default function CreatePost() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { slug } = router.query;
  const [postType, setPostType] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    const postData = {
      title,
      type: postType,
      communitySlug: slug,
    };

    if (postType === "text") postData.content = content;
    if (postType === "image") {
      if (!imageUrl) {
        toast.error("Please provide an image URL");
        setLoading(false);
        return;
      }
      postData.imageUrl = imageUrl;
    }
    if (postType === "link") {
      if (!linkUrl) {
        toast.error("Please provide a link URL");
        setLoading(false);
        return;
      }
      postData.linkUrl = linkUrl;
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (res.ok) {
      const post = await res.json();
      toast.success("Post created!");
      router.push(`/posts/${post.id}`);
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to create post");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-6">Create Post in r/{slug}</h1>
          
          <form onSubmit={handleSubmit}>
            {/* Post Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Post Type</label>
              <div className="flex gap-2">
                {[
                  { value: "text", label: "📝 Text" },
                  { value: "image", label: "🖼️ Image" },
                  { value: "link", label: "🔗 Link" }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setPostType(type.value);
                      if (type.value !== "image") setImageUrl("");
                      if (type.value !== "link") setLinkUrl("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      postType === type.value
                        ? "bg-[#FF4500] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                required
              />
            </div>

            {/* Text Post Content */}
            {postType === "text" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  placeholder="Write your post content here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                  required
                />
              </div>
            )}

            {/* Image URL Input */}
            {postType === "image" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste any image URL from the web (Imgur, Flickr, Cloudinary, etc.)
                </p>
                {imageUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Preview</label>
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="max-h-64 rounded-lg object-contain border p-2"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Link Post */}
            {postType === "link" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Link URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                  required
                />
                {linkUrl && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Preview:</p>
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                      {linkUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF4500] text-white py-3 rounded-lg font-medium hover:bg-[#FF5722] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Post"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}