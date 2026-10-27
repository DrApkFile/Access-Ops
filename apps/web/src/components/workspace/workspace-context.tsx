"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { request, type Building, type Principal } from "@/lib/accessops";
const Context = createContext<{
  principal: Principal | null;
  buildings: Building[];
  buildingId: string;
  setBuildingId: (id: string) => void;
  reload: () => Promise<void>;
  login: (
    email: string,
    password: string,
    workspaceId: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: Error | null;
} | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<Principal | null>(null),
    [buildings, setBuildings] = useState<Building[]>([]),
    [buildingId, select] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<Error | null>(null);
  async function reload() {
    const rows = await request<{ items: Building[] }>("/v1/buildings");
    setBuildings(rows.items);
    select((current) =>
      rows.items.some((b) => b.id === current)
        ? current
        : (rows.items.find(
            (b) => b.id === localStorage.getItem("accessops-building"),
          )?.id ??
          rows.items[0]?.id ??
          ""),
    );
  }
  useEffect(() => {
    let active = true;
    void request<Principal>("/auth/me")
      .then(async (me) => {
        if (!active) return;
        setPrincipal(me);
        const rows = await request<{ items: Building[] }>("/v1/buildings");
        if (active) {
          setBuildings(rows.items);
          select(
            rows.items.find(
              (b) => b.id === localStorage.getItem("accessops-building"),
            )?.id ??
              rows.items[0]?.id ??
              "",
          );
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(email: string, password: string, workspaceId: string) {
    await request("/auth/login", "POST", { email, password, workspaceId });
    const me = await request<Principal>("/auth/me");
    setPrincipal(me);
    await reload();
    setError(null);
  }
  async function logout() {
    try {
      await request("/auth/logout", "POST");
      setPrincipal(null);
      setBuildings([]);
      select("");
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Sign out failed"));
    }
  }
  function setBuildingId(id: string) {
    select(id);
    localStorage.setItem("accessops-building", id);
  }
  return (
    <Context.Provider
      value={{
        principal,
        buildings,
        buildingId,
        setBuildingId,
        reload,
        login,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Workspace provider missing");
  return context;
}
