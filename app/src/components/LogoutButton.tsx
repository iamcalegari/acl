import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { logoutLocal } from "../features/auth/authSlice";

type Props = {
  className?: string;
};

export function LogoutButton({
  className = "btn btn-outline-light btn-sm",
}: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logoutLocal());
    navigate("/login", { replace: true });
  }

  return (
    <button type="button" className={className} onClick={handleLogout}>
      Logout
    </button>
  );
}
