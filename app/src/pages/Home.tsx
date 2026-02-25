import { AclBoundary } from "../acl/AclBoundary";
import { CanInContext } from "../components/CanInContext";

export default function Home() {
  return (
    <AclBoundary module="debug" subModule="*">
      <CanInContext>
        <div className="container py-4">
          <h1>Home</h1>
          <p>Teste de ACL no frontend.</p>

          <div className="card p-3">
            <h5>Botões com permissão (herdam module/subModule)</h5>

            <div className="d-flex gap-2 flex-wrap">
              {/* Exemplo: ação de criação dentro do contexto */}

              <CanInContext action="create">
                <button className="btn btn-success">Ação CREATE</button>
              </CanInContext>

              {/* Exemplo: ação de update dentro do contexto */}
              <CanInContext action="update">
                <button className="btn btn-info">Ação UPDATE</button>
              </CanInContext>

              {/* Exemplo: delete */}
              <CanInContext
                action="delete"
                fallback={
                  <button
                    className="btn btn-secondary"
                    disabled
                    title="Sem permissão"
                  >
                    Ação DELETE (bloqueada)
                  </button>
                }
              >
                <button className="btn btn-danger">Ação DELETE</button>
              </CanInContext>
            </div>
          </div>

          <CanInContext>
            <div className="container py-4">
              <h5>Lista</h5>
              <ul>LISTINHA I</ul>
              <ul>LISTINHA II</ul>
              <ul>LISTINHA III</ul>
            </div>
          </CanInContext>
        </div>
      </CanInContext>
    </AclBoundary>
  );
}
