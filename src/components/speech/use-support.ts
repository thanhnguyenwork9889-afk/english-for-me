"use client";

import { useSyncExternalStore } from "react";

/** Feature detection never changes while the page is open, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};
/** The server has no `window`: report "not supported" so the first paint matches the HTML. */
const onServer = () => false;

/**
 * Whether a browser-only API exists, read the hydration-safe way. `check` must be a
 * stable module-level function (React calls it on every render).
 */
export const useSupport = (check: () => boolean): boolean =>
  useSyncExternalStore(noSubscribe, check, onServer);
