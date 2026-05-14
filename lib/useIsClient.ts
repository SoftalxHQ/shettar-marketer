import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True in the browser after hydration; false on the server and during SSR. */
export function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
