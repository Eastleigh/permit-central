import type { NormalizedPermit, PermitCategory, PermitSource } from "./types";
import { socrataQuery, toNum, zip5 } from "./socrata";

// City of Austin "Issued Construction Permits": https://data.austintexas.gov/d/3syk-w9eu
// We take residential Building Permits (BP) only. Electrical/plumbing/mechanical permits for the
// same project would just repeat the same job.

interface AustinRow {
  permit_number: string;
  permit_class?: string;
  work_class?: string;
  description?: string;
  issue_date: string;
  permit_location?: string;
  original_address1?: string;
  original_city?: string;
  original_zip?: string;
  total_job_valuation?: string;
  total_new_add_sqft?: string;
  latitude?: string;
  longitude?: string;
  link?: { url?: string };
  contractor_company_name?: string;
  contractor_phone?: string;
}

// Austin permit classes look like "R- 101 Single Family Houses"; the 3-digit code is the useful part.
function categorize(permitClass = "", workClass = ""): PermitCategory {
  const code = permitClass.match(/R-\s*(\d{3})/)?.[1];
  if (code === "645" || code === "646") return "teardown";
  if (code === "101" || code === "102" || code === "103" || code === "104") {
    return workClass === "New" ? "new_home" : "remodel";
  }
  if (code === "434") return "addition";
  if (code === "435") return "remodel";
  if (code === "329" || code === "330" || code === "437" || code === "438") return "accessory";
  return "other";
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const austin: PermitSource = {
  id: "austin",
  name: "City of Austin, TX",
  async fetchIssuedSince(sinceDate) {
    const rows = await socrataQuery<AustinRow>("data.austintexas.gov", "3syk-w9eu", {
      where: `permittype='BP' AND permit_class_mapped='Residential' AND issue_date >= '${sinceDate}T00:00:00'`,
      order: "issue_date DESC, permit_number",
    });
    return rows.map((r): NormalizedPermit => ({
      permitNumber: r.permit_number,
      issueDate: r.issue_date.slice(0, 10),
      address: (r.permit_location || r.original_address1 || "").trim(),
      city: r.original_city ? titleCase(r.original_city) : "Austin",
      zip: zip5(r.original_zip),
      category: categorize(r.permit_class, r.work_class),
      permitClass: r.permit_class?.replace(/^R-\s*\d+\s*/, "").trim() || null,
      workClass: r.work_class || null,
      description: (r.description || "").replace(/\s+/g, " ").trim(),
      valuation: toNum(r.total_job_valuation),
      sqft: toNum(r.total_new_add_sqft),
      lat: toNum(r.latitude),
      lng: toNum(r.longitude),
      link: r.link?.url || null,
      contractorName: r.contractor_company_name || null,
      contractorPhone: r.contractor_phone || null,
    }));
  },
};
