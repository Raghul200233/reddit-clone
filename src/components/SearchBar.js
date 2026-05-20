import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchCommunities, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleCommunityClick = (slug) => {
    setSearchTerm("");
    setShowResults(false);
    router.push(`/r/${slug}`);
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search communities..."
          className="search-input pl-10"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF4500]"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto slide-in">
          {results.length === 0 && searchTerm.length >= 2 && !loading ? (
            <div className="p-4 text-center text-gray-500">
              No communities found matching "{searchTerm}"
            </div>
          ) : (
            results.map((community) => (
              <button
                key={community.id}
                onClick={() => handleCommunityClick(community.slug)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      r/{community.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {community.description || "No description"}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {community.postCount || 0} posts
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}