import { KlasaClient } from "klasa";
import { CommonQuery } from "./common";

export class MongoCommonQuery implements CommonQuery {
	public client!: KlasaClient;

	public constructor(client: KlasaClient) {
		Object.defineProperty(this, "client", { value: client });
	}

	public get provider() {
		return this.client.providers.default;
	}
}
