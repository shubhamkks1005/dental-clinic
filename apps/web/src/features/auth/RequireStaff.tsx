import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError } from "../../api/client";
import { PageMessage } from "../../ui/PageMessage";
import { getMe, type Me } from "./api";

const MeContext = createContext<Me | null>(null);

// The signed-in person. Only usable inside RequireStaff.
export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe() used outside RequireStaff");
  return me;
}

type State = { status: "loading" } | { status: "ready"; me: Me } | { status: "offline" };

// Staff screens render only after /me succeeds. No session: full page load to the start page.
export function RequireStaff({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    getMe()
      .then((me) => setState({ status: "ready", me }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) window.location.replace("/");
        else setState({ status: "offline" });
      });
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "offline") {
    return (
      <PageMessage
        title="Cannot reach the clinic server"
        text="Check the internet connection, then reload the page."
      />
    );
  }
  return <MeContext.Provider value={state.me}>{children}</MeContext.Provider>;
}
