import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

export default function CreateCommunity() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!name) return "Community name is required";
    if (name.length < 3) return "Community name must be at least 3 characters";
    if (name.length > 21) return "Community name must be less than 21 characters";
    if (!nameRegex.test(name)) return "Only letters, numbers, underscores, and hyphens allowed";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateName(name);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Community r/${name} created successfully!`);
        router.push(`/r/${name.toLowerCase()}`);
      } else {
        toast.error(data.error || "Failed to create community");
        setError(data.error);
      }
    } catch (error) {
      console.error("Create community error:", error);
      toast.error("Failed to create community. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-2">Create a Community</h1>
          <p className="text-gray-600 mb-6">Create a new subreddit for your favorite topic</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Community Name
              </label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-gray-600">
                  r/
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="community-name"
                  className="flex-1 p-2.5 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only letters, numbers, underscores, and hyphens allowed. 3-21 characters.
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="What is this community about?"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                A short description that will appear on your community page.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#FF4500] text-white py-2.5 rounded-full font-medium hover:bg-[#FF5722] transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Community"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}