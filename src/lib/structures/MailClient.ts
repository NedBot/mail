import { KlasaClient, KlasaClientOptions } from "klasa";
import * as config from "../../config";

// Inbox
import InboxManager from "./InboxManager";

// Structures
import Embed from "./Embed";
import permissionLevels from "./Permissions";

// Database
import { Databases } from "../../types/Enums";
import { MongoCommonQuery } from "../queries/mongodb";
import ClientSchema from "../schemas/ClientSchema";

export class MailClient extends KlasaClient {
	public readonly embed = Embed;
	public readonly prefix: string = config.clientCommandPrefix;
	public readonly queries = new MongoCommonQuery(this);
	public readonly inbox = new InboxManager(this);

	public constructor(options: KlasaClientOptions) {
		super({
			...options,
			permissionLevels,
			gateways: {
				clientStorage: { schema: ClientSchema }
			}
		});

		this.gateways.register(Databases.Threads);
	}

	public async start(token: string = config.discordConnectionString) {
		await super.login(token);
		return this;
	}
}
