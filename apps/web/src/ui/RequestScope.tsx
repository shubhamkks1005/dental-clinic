import { createContext, useContext, type ReactNode } from "react";
import { noRequestScope, type RequestScope } from "./request-scope";

const Ctx = createContext<RequestScope>(noRequestScope);

export function RequestScopeProvider({
  scope,
  children,
}: {
  scope: RequestScope;
  children: ReactNode;
}) {
  return <Ctx.Provider value={scope}>{children}</Ctx.Provider>;
}

/** The scope of the screen above, or a pass-through when there is none. */
export function useRequestScope(): RequestScope {
  return useContext(Ctx);
}
