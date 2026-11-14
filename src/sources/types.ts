/**
 * A permit source is one city or county's permit feed. To add a new city:
 *   1. Create src/sources/<city>.ts exporting a PermitSource
 *   2. Add it to the list in src/sources/index.ts
 * Everything else (tagging, dashboard, emails, ZIP coverage) picks it up automatically.
 */

/** Rough kind of work, normalized across cities. The trade tagger keys off this. */
export type PermitCategory =
  | "new_home"   // new single-family / duplex / townhome
  | "addition"   // addition to an existing home
  | "remodel"    // interior/exterior remodel or repair
  | "accessory"  // pools, decks, fences, sheds, carports, retaining walls
  | "teardown"   // demolition of a home (a new home usually follows)
  | "other";

export interface NormalizedPermit {
  permitNumber: string;
  issueDate: string; // YYYY-MM-DD
  address: string;
  city: string | null;
  zip: string | null; // 5 digits
  category: PermitCategory;
  permitClass: string | null;
  workClass: string | null;
  description: string;
  valuation: number | null;
  sqft: number | null;
  lat: number | null;
  lng: number | null;
  link: string | null;
  contractorName: string | null;
  contractorPhone: string | null;
}

export interface PermitSource {
  id: string;   // short stable id, e.g. "austin"
  name: string; // shown to users, e.g. "City of Austin, TX"
  /** Return residential permits issued on or after `sinceDate` (YYYY-MM-DD). */
  fetchIssuedSince(sinceDate: string): Promise<NormalizedPermit[]>;
}
