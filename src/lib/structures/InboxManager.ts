import { Client, GuildMember, Message } from "discord.js";
import {
	mainGuildID,
	inboxGuildID,
	incomingThreadCategory,
	archivedThreadCategory
} from "../../config";
import { ClientStorage } from "../../types/settings/ClientStorage";
import { InboxMessage, InboxMessageReplyFlag, InboxMessageType } from "./InboxMessage";

// Inbox structures
import { InboxQueue } from "./InboxQueue";
import { Thread, ThreadStatus } from "./InboxThread";
import { ThreadCache } from "./InboxThreadCache";

export default class InboxManager {
	public client!: Client;
	public queue = new InboxQueue();
	public openThreadCache = new ThreadCache();

	public constructor(client: Client) {
		Object.defineProperty(this, "client", { value: client });
	}

	public async init() {
		this.client.console.log("Initalising inbox...");
		if (!this.mainGuild) return this.client.console.error("Invalid main guild ID");
		this.client.console.log("Fetched main server!");
		if (!this.inboxGuild) return this.client.console.error("Invalid inbox guild ID");
		this.client.console.log("Fetched inbox server!");

		return this.openThreadCache.init(this.client);
	}

	public registerMessage(message: Message) {
		return this.queue.push(() => this.handleMessage(message));
	}

	private async handleMessage(message: Message) {
		const { author } = message;
		if (this.isResponder(author.id)) return;
		if (this.isBlocked(author.id)) return;

		const member = await this.resolveMember(author.id);
		if (!member) return;

		const thread = await new Thread(member).restore(false);
		if (thread.status === ThreadStatus.Waiting) return;

		await thread.receiveMessage(message);

		return thread;
	}

	public async sendSystemMessage(destination: GuildMember, content: string, alert = false) {
		const message = new InboxMessage()
			.setType(InboxMessageType.System)
			.setReplyFlag(InboxMessageReplyFlag.System)
			.setContent(content);
		if (alert) message.setAlert();

		await destination.send(message.toEmbed()).catch(() => null);
		return this;
	}

	private isResponder(userID: string) {
		const responders: string[] = [];
		return responders.includes(userID);
	}

	private isBlocked(userID: string) {
		const blockedUsers = this.client.settings!.get(ClientStorage.userBlacklist);
		return blockedUsers.includes(userID);
	}

	private async resolveMember(userID: string) {
		if (!this.mainGuild) return null;
		return this.mainGuild.members.fetch(userID).catch(() => null);
	}

	protected get mainGuild() {
		return this.client.guilds.cache.get(mainGuildID);
	}

	public get inboxGuild() {
		const guild = this.client.guilds.cache.get(inboxGuildID);
		if (inboxGuildID && typeof inboxGuildID === "string" && !guild) return undefined;
		return guild || this.mainGuild;
	}

	public get incomingThreadCategory() {
		return incomingThreadCategory;
	}

	public get archivedThreadCategory() {
		return archivedThreadCategory;
	}
}
