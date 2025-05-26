import { Users, CheckCircle, AlertCircle, Database } from "lucide-react";

export default function StatsCard({ title, value, icon, color }) {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return <Users className={`h-10 w-10 text-${color}-500`} />;
      case "check-circle":
        return <CheckCircle className={`h-10 w-10 text-${color}-500`} />;
      case "alert-circle":
        return <AlertCircle className={`h-10 w-10 text-${color}-500`} />;
      default:
        return <Database className={`h-10 w-10 text-${color}-500`} />;
    }
  };

  const getBgColor = () => {
    switch (color) {
      case "blue":
        return "bg-blue-50";
      case "green":
        return "bg-green-50";
      case "red":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case "blue":
        return "border-blue-200";
      case "green":
        return "border-green-200";
      case "red":
        return "border-red-200";
      default:
        return "border-gray-200";
    }
  };

  return (
    <div className={`${getBgColor()} ${getBorderColor()} border rounded-lg p-5 shadow-sm`}>
      <div className="flex items-center">
        <div className="mr-4">
          {getIcon()}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}