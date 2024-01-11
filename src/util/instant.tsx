import { useQuery as useQuery_ } from "@instantdb/react";
import { InstantSchema } from "../instant-schema";
import { MutableRefObject, RefObject, useLayoutEffect, useRef } from "react";

// Deeply converts each property of the object (and nested objects) to arrays with 'id'
type Responsify<T> = {
  [P in keyof T]: T[P] extends object
    ? (Responsify<Omit<T[P], "$">> &
        InstantObject<
          // todo: fix ts(2356) ?
          InstantSchema[P]
        >)[]
    : T[P][];
};

export function useQuery<T>(q: T): ReturnType<
  typeof useQuery_<Responsify<T>>
> & {
  debugRef: RefObject<any>;
} {
  const r = useQuery_<Responsify<T>>(q);

  const debugRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = debugRef.current;
    if (!(el instanceof HTMLElement)) return;
    function debug() {
      // soon... ;)
    }

    el.addEventListener("mouseenter", debug);

    return () => {
      el.removeEventListener("mouseenter", debug);
    };
  });

  return {
    ...r,
    debugRef,
  };
}

export type InstantObject<T = unknown> = {
  id: string;
  [prop: string]: any;
} & T;
