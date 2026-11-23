import { shortRequestId } from "@clinic/shared";
import { Component, type ReactNode } from "react";
import { CopyButton } from "./CopyButton";

type State = { errorId: string | null };

// 1.4.7: if a screen crashes, show a plain page with an Error ID instead of a blank page or a
// stack trace. The ID and the error type go to the browser console only (no error tracker).
type Props = { children: ReactNode; onError?: (error: Error) => void };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { errorId: null };

  static getDerivedStateFromError(): State {
    return { errorId: shortRequestId(crypto.randomUUID()) };
  }

  override componentDidCatch(error: Error) {
    console.error("screen error:", error.name, this.state.errorId);
    this.props.onError?.(error);
  }

  override render() {
    if (!this.state.errorId) return this.props.children;
    return (
      <section className="card page-message" role="alert">
        <h1>Something went wrong on this page</h1>
        <p className="muted">
          Reload the page to try again. If it happens again, tell the developer this Error ID:{" "}
          <strong>{this.state.errorId}</strong>.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>{" "}
        <CopyButton text={this.state.errorId} label="Copy Error ID" />
      </section>
    );
  }
}
