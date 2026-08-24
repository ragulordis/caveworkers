import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ startLogin: vi.fn(), setLocation: vi.fn(), auth: { isAuthenticated: false, loading: false } }));
vi.mock("@/const", () => ({ startLogin: state.startLogin }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ ...state.auth, user: null, error: null, logout: vi.fn(), refresh: vi.fn() }) }));
vi.mock("wouter", async (importOriginal) => ({ ...(await importOriginal<typeof import("wouter")>()), useLocation: () => ["/", state.setLocation] }));
import Login from "./pages/Login";
import { TenantGate } from "./App";

describe("tenant login entry", () => {
  it("renders the Google sign-in action and starts the OAuth launcher when clicked", async () => {
    state.auth = { isAuthenticated: false, loading: false }; state.startLogin.mockReset();
    const user = userEvent.setup(); render(<Login />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(state.startLogin).toHaveBeenCalledOnce();
  });

  it("redirects unauthenticated users to the dedicated login route instead of rendering tenant content", async () => {
    state.auth = { isAuthenticated: false, loading: false }; state.setLocation.mockReset();
    render(<TenantGate><div>Private tenant workspace</div></TenantGate>);
    expect(screen.queryByText("Private tenant workspace")).toBeNull();
    await waitFor(() => expect(state.setLocation).toHaveBeenCalledWith("/login"));
  });
});
