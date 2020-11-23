import { KlasaClient, KlasaClientOptions } from "klasa";
import * as config from "../../config";

// Structures
import Embed from "./Embed";
import permissionLevels from "./Permissions";

export class MailClient extends KlasaClient {
	public readonly embed = Embed;
	public readonly prefix: string = config.clientCommandPrefix;

	public constructor(options: KlasaClientOptions) {
		super({
			...options,
			permissionLevels
		});
	}

	public async start(token: string = config.discordConnectionString) {
		await super.login(token);
		return this;
	}
}
