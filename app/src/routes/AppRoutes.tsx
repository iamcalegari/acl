import { Route, Routes } from "react-router-dom";
import { AclBoundary } from "../acl/AclBoundary";
import { ProtectedInContext } from "../components/ProtectedInContext";
import AuthedLayout from "../layouts/AuthedLayout";

import Forbidden from "../pages/Forbidden";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ModuleA from "../pages/ModuleA";
import ModuleBX from "../pages/ModuleBX";
import ModuleBY from "../pages/ModuleBY";

export function AppRoutes() {
  return (
    <Routes>
      {/* públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />

      {/* protegidas (qualquer usuário autenticado) */}
      <Route element={<AuthedLayout />}>
        {/* HOME (ex.: debug:submodule-y) */}
        <Route
          element={
            <AclBoundary module="debug" subModule="submodule-y">
              <ProtectedInContext action="read" />
            </AclBoundary>
          }
        >
          <Route path="/" element={<Home />} />
        </Route>

        {/* MODULE A (module-a:*) */}
        <Route
          element={
            <AclBoundary module="module-a" subModule="*">
              <ProtectedInContext action="read" />
            </AclBoundary>
          }
        >
          <Route path="/module-a" element={<ModuleA />} />
        </Route>

        {/* MODULE B - X (module-b:submodule-x) */}
        <Route
          element={
            <AclBoundary module="module-b" subModule="submodule-x">
              <ProtectedInContext action="read" />
            </AclBoundary>
          }
        >
          <Route path="/module-b/x" element={<ModuleBX />} />
        </Route>

        {/* MODULE B - Y (module-b:submodule-y) + scope */}
        <Route
          element={
            <AclBoundary
              module="module-b"
              subModule="submodule-y"
              scope="scopeId"
            >
              <ProtectedInContext action="read" />
            </AclBoundary>
          }
        >
          <Route path="/module-b/y" element={<ModuleBY />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="container py-4">404</div>} />
      </Route>
    </Routes>
  );
}
