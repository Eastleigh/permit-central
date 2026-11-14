import { initDb } from "../src/lib/db";
import { sendDigests } from "../src/lib/digest";

initDb()
  .then(sendDigests)
  .then((summary) => console.log(summary));
