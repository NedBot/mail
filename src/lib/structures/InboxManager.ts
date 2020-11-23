import { Client, Message } from "discord.js";
import { mainGuildID, inboxGuildID } from "../../config";

// Inbox structures
import { InboxQueue } from "./InboxQueue";
import { ThreadCache } from "./InboxThreadCache";

export default class InboxManager {
	public client!: Client;
	public queue = new InboxQueue();
	public openThreadCache = new ThreadCache();

	public constructor(client: Client) {
		Object.defineProperty(this, "client", { value: client });
	}

	public async init() {
		this.client.console.log("Initalising inbox..");
		if (!this.mainGuild) return this.client.console.error("Invalid main guild ID");
		this.client.console.log("Fetched main server...");
		if (!this.inboxGuild) return this.client.console.error("Invalid inbox guild ID");
		this.client.console.log("Fetched inboxed server...");

		return this.openThreadCache.init(this.client);
	}

	public registerMessage(message: Message) {
		// @ts-expect-error 2322
		return this.queue.push(() => this.handleMessage(message));
	}

	private async handleMessage(message: Message) {}

	protected get mainGuild() {
		return this.client.guilds.cache.get(mainGuildID);
	}

	protected get inboxGuild() {
		const guild = this.client.guilds.cache.get(inboxGuildID);
		if (inboxGuildID && typeof inboxGuildID === "string" && !guild) return undefined;
		return guild || this.mainGuild;
	}
}
