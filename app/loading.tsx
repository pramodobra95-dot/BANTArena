export default function Loading() {
  return (
    <div className="container-x py-10">
      <div className="skeleton mb-6 h-10 w-1/3" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton h-40 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
