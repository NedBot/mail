import { MongoCommonQuery } from "../lib/queries/mongodb";
import Embed from "../lib/structures/Embed";
import InboxManager from "../lib/structures/InboxManager";

declare module "discord.js" {
	interface Client {
		readonly embed: typeof Embed;
		readonly prefix: string;
		readonly queries: MongoCommonQuery;
		readonly inbox: InboxManager;
	}
}
