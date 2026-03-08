export default function Home() {
    return (
        <div className="flex flex-col gap-6">
            <div className="border-b border-git-border pb-4">
                <h1 className="text-xl font-semibold text-git-text">Home</h1>
            </div>

            {/* Compose Component Placeholder */}
            <div className="rounded-md border border-git-border bg-[#0D1117] p-4 p-4">
                <textarea
                    placeholder="What are you shipping?"
                    className="w-full bg-transparent outline-none resize-none font-mono text-sm placeholder:text-git-muted placeholder:font-sans"
                    rows={3}
                />
                <div className="mt-2 flex justify-end">
                    <button className="rounded-md bg-git-green px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2ea043] transition-colors">
                        Post
                    </button>
                </div>
            </div>

            {/* Feed Placeholder */}
            <div className="flex flex-col gap-4 mt-4">
                <div className="text-center text-sm text-git-muted py-10">
                    Feed is empty. Start shipping!
                </div>
            </div>
        </div>
    );
}
