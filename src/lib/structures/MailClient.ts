import { KlasaClient, KlasaClientOptions } from "klasa";
import * as config from "../../config";

// Structures
import Embed from "./Embed";
import permissionLevels from "./Permissions";

// Database
import { Database } from "../../types/Enums";
import ClientSchema from "../schemas/ClientSchema";

export class MailClient extends KlasaClient {
	public readonly embed = Embed;
	public readonly prefix: string = config.clientCommandPrefix;

	public constructor(options: KlasaClientOptions) {
		super({
			...options,
			permissionLevels,
			gateways: {
				clientStorage: { schema: ClientSchema }
			}
		});

		this.gateways.register(Database.Threads);
	}

	public async start(token: string = config.discordConnectionString) {
		await super.login(token);
		return this;
	}
}
