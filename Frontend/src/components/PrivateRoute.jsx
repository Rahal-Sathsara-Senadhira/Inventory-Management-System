import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-gray-500">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
