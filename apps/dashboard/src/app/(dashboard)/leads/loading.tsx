export default function LeadsLoading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="h-4 w-40 bg-gray-100 rounded mt-2" />
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>

        {/* Response time widget skeleton */}
        <div className="bg-gray-100 rounded-xl h-28 mb-4" />

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-20" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 h-10" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
            <div className="h-5 w-16 bg-gray-100 rounded-md" />
            <div className="h-5 w-20 bg-gray-100 rounded-md" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
