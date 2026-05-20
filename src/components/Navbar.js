import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2 md:py-0 gap-2">
          {/* Logo and Search - Left side */}
          <div className="flex items-center gap-4 flex-1">
            <Link href="/" className="text-xl font-bold text-[#FF4500] hover:text-[#FF5722] transition-colors shrink-0">
              Reddit Clone
            </Link>
            
            {/* Search Bar - Hidden on mobile, show in dropdown? Actually responsive */}
            <div className="hidden md:block flex-1">
              <SearchBar />
            </div>
          </div>

          {/* Right side - Auth buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Mobile search button */}
            <div className="md:hidden">
              <button
                onClick={() => router.push('/search')}
                className="p-2 text-gray-600 hover:text-[#FF4500]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {session ? (
              <>
                <Link
                  href="/create-community"
                  className="btn-secondary text-sm py-1.5 px-3 whitespace-nowrap"
                >
                  + Create Community
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 hidden sm:inline">
                    👤 {session.user?.username}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="btn-secondary text-sm py-1.5 px-3 whitespace-nowrap"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="btn-outline text-sm py-1.5 px-4">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary text-sm py-1.5 px-4">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile search bar */}
        <div className="md:hidden py-2">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}