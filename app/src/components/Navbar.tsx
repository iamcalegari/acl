import { Link } from "react-router-dom";
import { LogoutButton } from "./LogoutButton";
import { AclBoundary } from "../acl/AclBoundary";
import { CanInContext } from "./CanInContext";
import { useAppSelector } from "../app/hooks";

export function Navbar() {
  const role = useAppSelector((state) => state.auth.acl?.role);

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          ACL Test - {role}
        </Link>

        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/">
              Home
            </Link>
          </li>

          <AclBoundary module="module-a" subModule="*">
            <CanInContext>
              <li className="nav-item">
                <Link className="nav-link" to="/module-a">
                  Module A
                </Link>
              </li>
            </CanInContext>
          </AclBoundary>

          <AclBoundary module="module-b" subModule="submodule-x">
            <CanInContext>
              <li className="nav-item">
                <Link className="nav-link" to="/module-b/x">
                  Module B - X
                </Link>
              </li>
            </CanInContext>
          </AclBoundary>

          <AclBoundary
            module="module-b"
            subModule="submodule-y"
            scope="scopeId"
          >
            <CanInContext>
              <li className="nav-item">
                <Link className="nav-link" to="/module-b/y">
                  Module B - Y (scoped)
                </Link>
              </li>
            </CanInContext>
          </AclBoundary>
        </ul>

        <div className="ms-auto d-flex gap-2">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
