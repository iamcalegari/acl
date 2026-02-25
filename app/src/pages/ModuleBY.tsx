import { AclBoundary } from "../acl/AclBoundary";
import { CanInContext } from "../components/CanInContext";

export default function ModuleBY() {
  return (
    <AclBoundary module="module-b" subModule="submodule-y" scope="scopeId">
      <CanInContext>
        <div className="container py-4">
          <h1>Module B - Submodule Y</h1>
          <p>Render (read) com scope.</p>

          <CanInContext
            action="update"
            fallback={
              <div className="alert alert-warning">Sem permissão de UPDATE</div>
            }
          >
            <button className="btn btn-warning">Editar</button>
          </CanInContext>
        </div>
      </CanInContext>
    </AclBoundary>
  );
}
