import { MongoCommonQuery } from "../lib/queries/mongodb";
import Embed from "../lib/structures/Embed";
import InboxManager from "../lib/structures/InboxManager";
import { CustomGet } from "./settings/Common";

declare module "discord.js" {
	interface Client {
		readonly embed: typeof Embed;
		readonly prefix: string;
		readonly queries: MongoCommonQuery;
		readonly inbox: InboxManager;
	}
}

declare module "klasa" {
	interface Settings {
		get<K extends string, S>(value: CustomGet<K, S>): S;
	}
}
