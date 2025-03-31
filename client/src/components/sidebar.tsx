import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Unit } from "@shared/schema";
import { Menu, Home, LogOut, UserCog, FunctionSquare, BookOpen, BarChart2, Cloud, Book } from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
};

const Sidebar = ({ isMobileMenuOpen, toggleMobileMenu }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Fetch units for the sidebar
  const { data: units } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  // Keep all units in a single list as requested by the user
  const allUnits = units || [];

  // Get the current user's rank
  const userRank = user?.rank ? `#${user.rank}` : "";

  return (
    <>
      <aside 
        className={`bg-white shadow-md w-full md:w-64 md:min-h-screen md:fixed overflow-y-auto max-h-screen transition-all duration-300 z-20 ${
          isMobileMenuOpen ? "fixed inset-0 h-screen z-50" : "hidden md:block"
        }`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Academic Portal</h1>
          <Button variant="ghost" onClick={toggleMobileMenu} className="text-gray-500 focus:outline-none p-1">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Profile Section */}
        {user && (
          <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
            <div className="relative">
              <img 
                src={user.profileImageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
              />
              <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-white"></span>
              {userRank && (
                <span className="absolute -top-1 -right-1 bg-white rounded-full text-xs font-semibold px-1 text-primary border border-primary">
                  {userRank}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.admissionNumber}</p>
            </div>
          </div>
        )}
        
        {/* Navigation Items */}
        <nav className="p-2">
          <div className="mb-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Main</p>
            <Link href="/">
              <a className={`flex items-center px-3 py-2 rounded-lg mb-1 ${
                location === "/" 
                  ? "text-primary bg-blue-50 font-medium" 
                  : "hover:bg-gray-100 transition-colors"
              }`}>
                <Home className="mr-3 h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </Link>
          </div>
          
          {/* All Units */}
          <div className="mb-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Course Units</p>
            
            {allUnits.map(unit => (
              <Link key={unit.id} href={`/unit/${unit.unitCode}`}>
                <a className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${
                  location === `/unit/${unit.unitCode}` 
                    ? "text-primary bg-blue-50 font-medium" 
                    : "hover:bg-gray-100 transition-colors"
                }`}>
                  <div className="flex items-center">
                    {unit.unitCode.startsWith("MAT") && <FunctionSquare className="mr-3 h-5 w-5 text-blue-500" />}
                    {unit.unitCode.startsWith("STA") && <BarChart2 className="mr-3 h-5 w-5 text-green-500" />}
                    {unit.unitCode.startsWith("DAT") && <Cloud className="mr-3 h-5 w-5 text-purple-500" />}
                    {unit.unitCode.startsWith("HED") && <Book className="mr-3 h-5 w-5 text-amber-500" />}
                    <span>{unit.unitCode}: {unit.name}</span>
                  </div>
                  {unit.notificationCount !== undefined && unit.notificationCount > 0 && (
                    <span className={`${
                      unit.unitCode.startsWith("MAT") ? "bg-blue-500" :
                      unit.unitCode.startsWith("STA") ? "bg-green-500" :
                      unit.unitCode.startsWith("DAT") ? "bg-purple-500" :
                      "bg-amber-500"
                    } text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1`}>
                      {unit.notificationCount}
                    </span>
                  )}
                </a>
              </Link>
            ))}
          </div>
          
          <div className="mt-4">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Settings</p>
            
            <Link href="/profile">
              <a className={`flex items-center px-3 py-2 rounded-lg mb-1 ${
                location === "/profile" 
                  ? "text-primary bg-blue-50 font-medium" 
                  : "hover:bg-gray-100 transition-colors"
              }`}>
                <UserCog className="mr-3 h-5 w-5 text-gray-500" />
                <span>Profile Settings</span>
              </a>
            </Link>
            
            <button 
              onClick={() => logoutMutation.mutate()} 
              className="w-full flex items-center px-3 py-2 rounded-lg mb-1 hover:bg-gray-100 transition-colors text-left text-red-500"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
