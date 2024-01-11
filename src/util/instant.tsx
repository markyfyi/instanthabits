import { useQuery as useQuery_ } from "@instantdb/react";
import { InstantSchema } from "../instant-schema";
import {
  MutableRefObject,
  ReactNode,
  RefObject,
  forwardRef,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { Root, createRoot } from "react-dom/client";

let debugMode = false;

let rootEl: HTMLElement | null = null;
let reactRoot: Root | null = null;

// Deeply converts each property of the object (and nested objects) to arrays with 'id'
type Responsify<T> = {
  [P in keyof T]: T[P] extends object
    ? (Responsify<Omit<T[P], "$">> &
        InstantObject<
          // @ts-expect-error todo: fix ts(2356) ?
          InstantSchema[P]
        >)[]
    : T[P][];
};

addEventListener("keydown", (e) => {
  if (e.key === "i" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
    debugMode = !debugMode;

    if (!debugMode) {
      reactRoot?.render(null);
    }
  }
});

export function useQuery<T>(q: T): ReturnType<
  typeof useQuery_<Responsify<T>>
> & {
  instantDebugRef: RefObject<any>;
} {
  const r = useQuery_<Responsify<T>>(q);

  const instantDebugRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = instantDebugRef.current;
    if (!(el instanceof HTMLElement)) return;

    function showDebug(e: MouseEvent) {
      if (!debugMode) return;
      renderDebug(
        <div
          style={{
            position: "fixed",
            top: e.clientY,
            left: e.clientX,
            pointerEvents: "none",
          }}
        >
          <Debug data={r} />
        </div>
      );
    }

    function hideDebug(e: MouseEvent) {
      if (!debugMode) return;
      reactRoot?.render(null);
    }

    el.addEventListener("mousemove", showDebug);
    el.addEventListener("mouseleave", hideDebug);

    return () => {
      el.removeEventListener("mousemove", showDebug);
      el.removeEventListener("mouseleave", hideDebug);
    };
  });

  return {
    ...r,
    instantDebugRef,
  };
}

export type InstantObject<T = unknown> = {
  id: string;
  [prop: string]: any;
} & T;

function renderDebug(reactEl: ReactNode) {
  rootEl = rootEl ?? document.createElement("div");
  rootEl.id = "__instant-debug";
  if (!document.body.contains(rootEl)) {
    document.body.appendChild(rootEl);
  }

  reactRoot = reactRoot ?? createRoot(rootEl);
  reactRoot.render(reactEl);
}

const Debug = forwardRef(function (props: any, ref: any) {
  return (
    <pre
      ref={ref}
      style={{
        fontFamily: "monospace",
        fontSize: "8pt",
        padding: "1rem",
        overflow: "auto",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(20px)",
        borderRadius: "0.5rem",
        maxHeight: "20rem",
        maxWidth: "20rem",
      }}
    >
      {JSON.stringify(props, null, "  ")}
    </pre>
  );
});
