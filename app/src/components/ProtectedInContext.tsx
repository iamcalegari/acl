import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { selectAuthStatus } from "../features/auth/selectors";
import { CanInContext } from "./CanInContext";
import type { PolicyAction } from "../acl/types";

export function ProtectedInContext({
  action = "read",
  redirectTo = "/403",
}: {
  action?: PolicyAction;
  redirectTo?: string;
}) {
  const status = useAppSelector(selectAuthStatus);

  if (status !== "authenticated") return <Navigate to="/login" replace />;

  return (
    <CanInContext
      action={action}
      fallback={<Navigate to={redirectTo} replace />}
    >
      <Outlet />
    </CanInContext>
  );
}
