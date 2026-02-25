import type { RootState } from "../../app/store";
import { can } from "../../acl/can";
import type { CanArgs } from "../../acl/types";

export const selectAclIndex = (s: RootState) => s.auth?.aclResources ?? null;

export const selectCan =
  (args: CanArgs) =>
    (state: RootState) =>
      can(selectAclIndex(state), args);

export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectAuthError = (s: RootState) => s.auth.error;
