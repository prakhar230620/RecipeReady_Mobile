export default function LoadingShimmer() {
  return (
    <div className="bg-card rounded-xl border overflow-hidden mobile-card">
      <div className="h-40 shimmer" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 shimmer rounded w-3/4" />
          <div className="h-3 shimmer rounded w-full" />
        </div>

        <div className="flex gap-1">
          <div className="h-5 shimmer rounded w-16" />
          <div className="h-5 shimmer rounded w-12" />
          <div className="h-5 shimmer rounded w-14" />
        </div>

        <div className="space-y-2">
          <div className="h-4 shimmer rounded w-24" />
          <div className="h-3 shimmer rounded w-full" />
          <div className="h-3 shimmer rounded w-5/6" />
        </div>

        <div className="flex justify-between pt-2">
          <div className="h-7 shimmer rounded w-24" />
          <div className="flex gap-1">
            <div className="h-7 w-7 shimmer rounded-full" />
            <div className="h-7 w-7 shimmer rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
