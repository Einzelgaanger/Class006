import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import UnitTabs from "@/components/unit-tabs";
import { Unit } from "@shared/schema";
import { FileText, BookOpen, BarChart2, FunctionSquare, Cloud, Book, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map of unit codes to their icons and colors
const unitStyles: Record<string, { icon: React.ReactNode, color: string }> = {
  "MAT2101": { icon: <FunctionSquare className="text-blue-500" />, color: "text-blue-500" },
  "MAT2102": { icon: <FunctionSquare className="text-blue-500" />, color: "text-blue-500" },
  "STA2101": { icon: <BarChart2 className="text-green-500" />, color: "text-green-500" },
  "DAT2101": { icon: <FileText className="text-purple-500" />, color: "text-purple-500" },
  "DAT2102": { icon: <Cloud className="text-purple-500" />, color: "text-purple-500" },
  "HED2101": { icon: <Book className="text-amber-500" />, color: "text-amber-500" }
};

// Get a default if unit code isn't in our map
const getUnitStyle = (unitCode: string) => {
  return unitStyles[unitCode] || { icon: <BookOpen className="text-gray-500" />, color: "text-gray-500" };
};

export default function UnitPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const params = useParams<{ unitCode: string }>();
  const unitCode = params.unitCode;

  // Get unit details
  const { data: unit, isLoading } = useQuery<Unit>({
    queryKey: [`/api/units/${unitCode}`],
  });

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Effect to handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const unitStyle = getUnitStyle(unitCode);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu} 
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="md:hidden p-4 flex items-center">
          <Button 
            variant="ghost" 
            onClick={toggleMobileMenu} 
            className="text-gray-700 focus:outline-none p-2 mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">{unitStyle.icon}</span>
            <h2 className="text-lg font-semibold">{unit?.name || unitCode}</h2>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{unitStyle.icon}</span>
              <h1 className="text-2xl font-bold">{unit?.name || unitCode}</h1>
            </div>
            <p className="text-gray-600 ml-7">{unit?.description || "Loading..."}</p>
          </div>

          <UnitTabs unitCode={unitCode} />
        </div>
      </main>
    </div>
  );
}
