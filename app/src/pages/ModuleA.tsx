import { AclBoundary } from "../acl/AclBoundary";
import { CanInContext } from "../components/CanInContext";

export default function ModuleA() {
  return (
    <AclBoundary module="module-a" subModule="*">
      <CanInContext>
        <div className="container py-4">
          <h1>Module A</h1>
          <p>Render (read) permitido para module-a:*</p>

          <AclBoundary module="module-a" subModule="submodule-x">
            <div className="card p-3">
              <h2>Module A - Submodule X</h2>
              <p>Render (read) permitido para module-a:submodule-x</p>

              <ul>
                <li>Item A</li>
                <li>Item B</li>
                <li>Item C</li>
                <li>Item D</li>
              </ul>

              <CanInContext>
                <div className="d-flex gap-2">
                  <CanInContext action="create">
                    <button className="btn btn-primary">Criar</button>
                  </CanInContext>

                  <CanInContext action="update">
                    <button className="btn btn-warning">Editar</button>
                  </CanInContext>

                  <CanInContext action="delete">
                    <button className="btn btn-danger">Excluir</button>
                  </CanInContext>
                </div>
              </CanInContext>
            </div>
          </AclBoundary>

          <AclBoundary module="module-a" subModule="submodule-y">
            <div className="card p-3">
              <h2>Module A - Submodule Y</h2>
              <p>Render (read) permitido para module-a:submodule-y</p>

              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
              </ul>

              <CanInContext>
                <div className="d-flex gap-2">
                  <CanInContext action="create">
                    <button className="btn btn-primary">Criar</button>
                  </CanInContext>

                  <CanInContext action="update">
                    <button className="btn btn-warning">Editar</button>
                  </CanInContext>

                  <CanInContext action="delete">
                    <button className="btn btn-danger">Excluir</button>
                  </CanInContext>
                </div>
              </CanInContext>
            </div>
          </AclBoundary>
        </div>
      </CanInContext>
    </AclBoundary>
  );
}
