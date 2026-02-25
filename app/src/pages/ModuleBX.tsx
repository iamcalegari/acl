import { AclBoundary } from "../acl/AclBoundary";
import { CanInContext } from "../components/CanInContext";

export default function ModuleBX() {
  return (
    <AclBoundary module="module-b" subModule="submodule-x">
      <CanInContext>
        <div className="container py-4">
          <h1>Module B - Submodule X</h1>
          <p>Render (read) permitido para module-b:submodule-x</p>

          <CanInContext action="create">
            <button className="btn btn-primary">Criar algo em X</button>
          </CanInContext>
        </div>
      </CanInContext>
    </AclBoundary>
  );
}
