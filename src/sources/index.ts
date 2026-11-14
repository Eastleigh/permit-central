import { austin } from "./austin";
import type { PermitSource } from "./types";

// Add new cities here, e.g. roundRock, georgetown, cedarPark.
export const SOURCES: PermitSource[] = [austin];

export const sourceName = (id: string) => SOURCES.find((s) => s.id === id)?.name ?? id;
