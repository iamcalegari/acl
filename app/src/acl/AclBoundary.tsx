import React from "react";
import { AclContext } from "./aclContext";

export function AclBoundary({
  module,
  subModule = "*",
  scope,
  children,
}: {
  module: string;
  subModule?: string;
  scope?: string;
  children: React.ReactNode;
}) {
  return (
    <AclContext.Provider value={{ module, subModule, scope }}>
      {children}
    </AclContext.Provider>
  );
}
