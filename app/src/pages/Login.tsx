import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { login, fetchMe } from "../features/auth/authSlice";
import { selectAuthError, selectAuthStatus } from "../features/auth/selectors";

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const [id, setId] = useState("1");
  const [email, setEmail] = useState("user@test.com");
  const [senha, setSenha] = useState("123");
  const [acl, setAcl] = useState("3");

  const disabled = useMemo(() => status === "loading", [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // 1) faz login e guarda accessToken
      await dispatch(login({ id, email, senha, acl })).unwrap();

      // 2) busca /me (agora com Bearer automaticamente)
      await dispatch(fetchMe()).unwrap();

      // 3) redireciona
      navigate("/", { replace: true });
    } catch {
      // erro já vai pro state.error
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <h1 className="mb-3">Login</h1>
      <p className="text-muted">
        Envia <code>id</code>, <code>email</code>, <code>senha</code> (e
        opcionalmente <code>acl</code>) para <code>/api/login</code>.
      </p>

      <div className="card shadow-sm">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label">ID</label>
              <input
                className="form-control"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="form-label">Senha</label>
              <input
                className="form-control"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="form-label">ACL (opcional)</label>
              <input
                className="form-control"
                value={acl}
                onChange={(e) => setAcl(e.target.value)}
                disabled={disabled}
              />
              <div className="form-text">
                Seu schema não exige <code>acl</code>, mas o backend usa{" "}
                <code>aclId</code> no payload do token.
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={disabled}
            >
              {disabled ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 text-muted small">
        Dica: se o seu backend espera o token via cookie (em vez de Bearer), me
        fala que eu adapto para ele setar cookie no login.
      </div>
    </div>
  );
}
