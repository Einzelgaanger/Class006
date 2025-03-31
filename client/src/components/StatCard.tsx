import { ReactNode } from "react";

type BadgeProps = {
  text: string;
  color: "red" | "amber" | "blue" | "green" | "purple" | "gray";
};

type StatCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "amber";
  badges?: BadgeProps[];
};

export default function StatCard({ title, value, icon, color, badges }: StatCardProps) {
  // Color mapping
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      text: "text-primary"
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-500"
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-500"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-500"
    }
  };

  // Badge color mapping
  const badgeColorMap = {
    red: "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-500",
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-700"
  };

  const selectedColor = colorMap[color];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-full ${selectedColor.bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {badges && badges.length > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          {badges.map((badge, index) => (
            <span 
              key={index} 
              className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColorMap[badge.color]}`}
            >
              {badge.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
