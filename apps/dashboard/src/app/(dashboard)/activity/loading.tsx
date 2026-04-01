export default function ActivityLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-36 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-20" />
          ))}
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-7 w-16 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Feed skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
                <div className="h-5 w-14 bg-gray-100 rounded-md" />
                <div className="h-5 w-8 bg-gray-100 rounded-md" />
              </div>
              <div className="h-3 w-64 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-12 bg-gray-100 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
