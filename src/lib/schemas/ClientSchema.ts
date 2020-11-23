import { KlasaClient } from "klasa";

export default KlasaClient.defaultClientSchema.add("threadID", "number", { default: 0 });
