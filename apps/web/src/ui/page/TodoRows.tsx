import type { ReactNode } from "react";
import "./todo.css";

export type TodoItem = {
  key: string;
  /** Short capital label: "DISCOUNT WAITING". */
  kind: string;
  tone: "warning" | "danger" | "info";
  who: string;
  note?: string;
  /** One action: a Link or a button. */
  action: ReactNode;
};

// "Waiting for you" lines (DoctorToday.dc.html): what it is, who, one line of why, one action.
export function TodoRows({ items }: { items: TodoItem[] }) {
  return (
    <ul className="todo-rows">
      {items.map((item) => (
        <li key={item.key} className="todo-row">
          <span className="todo-text">
            <span className={`todo-kind is-${item.tone}`}>{item.kind}</span>
            <span className="todo-who">{item.who}</span>
            {item.note ? <span className="todo-note muted">{item.note}</span> : null}
          </span>
          {item.action}
        </li>
      ))}
    </ul>
  );
}
