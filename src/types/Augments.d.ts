import Embed from "../lib/structures/Embed";

declare module "discord.js" {
	interface Client {
		readonly embed: typeof Embed;
		readonly prefix: string;
	}
}
