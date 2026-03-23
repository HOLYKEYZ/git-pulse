import { FeedSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col">
            {/* tabs placeholder */}
            <div className="sticky top-0 z-10 bg-git-bg/95 backdrop-blur border-b border-git-border px-4 pt-4 flex gap-6 pb-3 h-[52px]">
                <div className="h-4 w-16 bg-git-muted/20 animate-pulse rounded" />
                <div className="h-4 w-16 bg-git-muted/10 animate-pulse rounded" />
            </div>

            {/* compose placeholder */}
            <div className="p-4 border-b border-git-border space-y-3">
                <div className="flex gap-2">
                    <div className="h-6 w-24 bg-git-muted/10 animate-pulse rounded-full" />
                    <div className="h-6 w-32 bg-git-muted/5 animate-pulse rounded-full" />
                </div>
                <div className="h-24 w-full bg-git-muted/5 animate-pulse rounded-xl" />
            </div>

            {/* feed skeleton */}
            <FeedSkeleton />
        </div>);

}