import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchCommunities = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/communities/search?q=${searchTerm}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchCommunities, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-md border border-gray-200 p-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search communities..."
            className="search-input"
            autoFocus
          />
        </div>

        {loading && (
          <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4500] mx-auto"></div>
            <p className="text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {!loading && searchTerm.length >= 2 && results.length === 0 && (
          <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No communities found matching "{searchTerm}"</p>
          </div>
        )}

        <div className="space-y-2">
          {results.map((community) => (
            <Link
              key={community.id}
              href={`/r/${community.slug}`}
              className="block bg-white rounded-md border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="font-semibold text-lg text-gray-900">r/{community.name}</div>
              {community.description && (
                <p className="text-gray-600 text-sm mt-1">{community.description}</p>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {community.postCount || 0} posts
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}