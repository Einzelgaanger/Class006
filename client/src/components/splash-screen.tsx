import { useEffect, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400); // Small delay after completion for better UX
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800 text-white">
      <div className="flex flex-col items-center justify-center space-y-8 px-6 text-center">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-10 w-10 text-white" />
          <h1 className="text-4xl font-bold tracking-tight">
            SDS Year 2 Group B
          </h1>
          <Sparkles className="h-8 w-8 text-amber-300" />
        </div>
        
        <p className="text-xl text-blue-100 max-w-md">
          Your comprehensive academic management portal
        </p>
        
        <div className="w-full max-w-md h-2 bg-blue-950 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-300 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm text-blue-200">
          {progress < 100 ? "Loading resources..." : "Welcome!"}
        </p>
      </div>
    </div>
  );
}