import { useQuery as useQuery_ } from "@instantdb/react";
import { InstantSchema } from "../instant-schema";

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

export function useQuery<T>(q: T) {
  return useQuery_<Responsify<T>>(q);
}

export type InstantObject<T = unknown> = {
  id: string;
  [prop: string]: any;
} & T;
