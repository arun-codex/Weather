/**
 * LoadingSkeleton.jsx
 * --------------------
 * Shimmer placeholder UI shown while weather data is loading.
 * Mimics the layout of the real content to prevent layout shift.
 */

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-8 pb-6 space-y-4 animate-fade-in">

      {/* Current weather card skeleton */}
      <div className="glass rounded-3xl p-8 space-y-4">
        {/* City name */}
        <div className="skeleton h-5 w-32 rounded-full mx-auto" />
        {/* Big temp */}
        <div className="skeleton h-24 w-40 rounded-2xl mx-auto" />
        {/* Condition */}
        <div className="skeleton h-4 w-24 rounded-full mx-auto" />
        {/* Feels like */}
        <div className="skeleton h-3 w-36 rounded-full mx-auto" />
      </div>

      {/* Hourly strip skeleton */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="skeleton h-3 w-10 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-4 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Daily forecast skeleton */}
      <div className="glass rounded-2xl p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="skeleton h-4 w-12 rounded-full" />
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="skeleton h-3 w-20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Details grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-2">
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-lg" />
            <div className="skeleton h-3 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
