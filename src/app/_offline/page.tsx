export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <p className="text-sm text-muted-foreground">
          Your offline data will sync automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  )
}

