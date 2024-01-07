import { useQuery as useQuery_ } from "@instantdb/react";

// Deeply converts each property of the object (and nested objects) to arrays with 'id'
type Responsify<T> = {
  [P in keyof T]: T[P] extends object
    ? (Responsify<T[P]> & { id: string; [k: string]: any })[]
    : T[P][];
};

export function useQuery<T>(q: T) {
  return useQuery_<Responsify<T>>(q);
}

export type InstantObject = {
  id: string;
  [prop: string]: any;
};
