export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <div className="flex gap-4">
            {/* Vote buttons skeleton */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="w-6 h-4 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1">
              {/* Metadata */}
              <div className="flex gap-2 mb-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              
              {/* Title */}
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              
              {/* Content */}
              <div className="space-y-2 mb-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}