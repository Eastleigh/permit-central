import { initDb } from "../src/lib/db";
import { ingestAll } from "../src/lib/ingest";

initDb()
  .then(ingestAll)
  .then((summary) => console.log(JSON.stringify(summary, null, 2)));
