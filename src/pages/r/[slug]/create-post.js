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
  const [uploading, setUploading] = useState(false);

  // Client-side redirect - only runs after mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Don't render the form if not authenticated
  if (!session) {
    return null;
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setImageUrl(data.imageUrl);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
        toast.error("Please upload an image or provide an image URL");
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

    console.log("Sending post data:", postData);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    console.log("Response status:", res.status);

    if (res.ok) {
      const post = await res.json();
      toast.success("Post created!");
      router.push(`/posts/${post.id}`);
    } else {
      const error = await res.json();
      console.error("Error response:", error); 
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
                  { value: "text", label: "📝 Text", icon: "📝" },
                  { value: "image", label: "🖼️ Image", icon: "🖼️" },
                  { value: "link", label: "🔗 Link", icon: "🔗" }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setPostType(type.value);
                      // Reset fields when switching
                      if (type.value !== "image") setImageUrl("");
                      if (type.value !== "link") setLinkUrl("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      postType === type.value
                        ? "bg-blue-600 text-white"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Write your post content here... (Markdown supported)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Image Post - Upload or URL */}
            {postType === "image" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image</label>
                
                {/* Option Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      !imageUrl.startsWith('http') && imageUrl !== ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    📁 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      imageUrl.startsWith('http')
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-xl">📤</span>
                    {uploading ? 'Uploading...' : 'Choose Image File'}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports: JPG, PNG, GIF, WEBP (Max 5MB)
                  </p>
                </div>

                {/* Image URL Input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Or Image URL</label>
                  <input
                    type="url"
                    value={imageUrl.startsWith('http') ? imageUrl : ''}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Image Preview */}
                {(imageUrl || imageUrl?.startsWith('/uploads')) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Preview</label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image';
                        }}
                      />
                      {imageUrl?.startsWith('/uploads') && (
                        <p className="text-xs text-green-600 mt-2 text-center">
                          ✅ Image uploaded successfully!
                        </p>
                      )}
                    </div>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : uploading ? "Uploading Image..." : "Create Post"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}