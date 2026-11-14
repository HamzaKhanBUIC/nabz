import { writeFileSync } from "node:fs";
import { renderContractJson } from "../../src/schemas/export";

writeFileSync(new URL("../../contract/schemas.json", import.meta.url), renderContractJson(), "utf8");
console.log("Wrote contract/schemas.json");
