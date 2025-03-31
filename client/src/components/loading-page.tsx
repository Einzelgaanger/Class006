import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-700 mb-1">Loading</h2>
        <p className="text-sm text-gray-500">Please wait while we load your content...</p>
      </div>
    </div>
  );
}