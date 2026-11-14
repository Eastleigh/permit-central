/** Helper for city open-data portals that run on Socrata (Austin, Dallas, NYC, Chicago, and many more). */
export async function socrataQuery<T>(
  domain: string,
  datasetId: string,
  params: { where: string; order: string },
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`https://${domain}/resource/${datasetId}.json`);
    url.searchParams.set("$where", params.where);
    url.searchParams.set("$order", params.order);
    url.searchParams.set("$limit", String(pageSize));
    url.searchParams.set("$offset", String(offset));
    const headers: Record<string, string> = {};
    if (process.env.SOCRATA_APP_TOKEN) headers["X-App-Token"] = process.env.SOCRATA_APP_TOKEN;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`${domain}/${datasetId}: HTTP ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export const toNum = (v: string | undefined) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

export const zip5 = (v: string | undefined) => {
  const m = v?.match(/\d{5}/);
  return m ? m[0] : null;
};
