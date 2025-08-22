// src/components/RequirePermission.jsx
import { useAuth } from "../context/AuthContext";
import { hasPerm } from "../utils/authz";

export default function RequirePermission({ perm, children, fallback = null }) {
  const { user, permissions } = useAuth();
  if (!user) return null; // or spinner
  return hasPerm(user, permissions, perm) ? children : fallback;
}
