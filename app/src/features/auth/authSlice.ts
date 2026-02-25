import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ACL, MePayload } from "../../acl/types";
import { apiFetch, clearAccessToken, setAccessToken } from "../../lib/api";
import type { AclResources, ApiOk, LoginRequest, LoginResponse, MeData } from "./types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";


type AuthState = {
  status: AuthStatus;
  me: MePayload | null;
  accessToken: string | null;
  error?: string;
  acl?: ACL;
  aclResources?: AclResources;
};


const initialState: AuthState = {
  status: "idle",
  me: null,
  accessToken: localStorage.getItem("accessToken"),
  error: undefined,
  acl: undefined,
  aclResources: undefined,
};

export const login = createAsyncThunk(
  "/auth/login",
  async (payload: LoginRequest) => {
    const data = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setAccessToken(data.accessToken);
    return data;
  }
);


export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const res = await apiFetch<ApiOk<MeData>>("/api/me");
  return res.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutLocal(state) {
      state.status = "unauthenticated";
      state.me = null;
      state.acl = undefined;
      state.aclResources = undefined;
      state.accessToken = null;
      state.error = undefined;
      clearAccessToken();
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        // ainda não tem /me aqui — vamos buscar na sequência (na tela)
        state.status = "loading";
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.error.message;
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.me = action.payload;
        state.acl = action.payload.acl;
        state.aclResources = action.payload.aclResources;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.me = null;
        state.error = action.error.message;
        clearAccessToken();
        state.accessToken = null;
      });
  },
});

export const { logoutLocal, setToken } = authSlice.actions;
export default authSlice.reducer;
