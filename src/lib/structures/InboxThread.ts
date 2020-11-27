import { Client, GuildMember, Message, TextChannel } from "discord.js";
import { modmailReceived } from "../../config";
import { Tasks } from "../../types/Enums";
import { ClientStorage } from "../../types/settings/ClientStorage";
import { InboxMessage, InboxMessageType, RawInboxMessage, Transcript } from "./InboxMessage";
import { Timestamp } from "klasa";

const timestamp = new Timestamp("DD/MM/YY");

export class Thread {
	public client!: Client;
	public member: GuildMember | null = null;
	public status: ThreadStatus = ThreadStatus.Waiting;
	public id: number = 0;
	public channelID: string | null = null;
	public userID!: string;
	public messages: RawInboxMessage[] = [];
	public read = true;

	public constructor(member: GuildMember | null, client?: Client) {
		if (!client && member) client = member.client;
		if (!client) throw "You must pass an instance of the client";
		Object.defineProperty(this, "member", { value: member });
		Object.defineProperty(this, "client", { value: client });
		if (member) this.userID = member.id;
	}

	public restore(sync: boolean): Promise<this> {
		const openThread = this.client.inbox.openThreadCache.get(this.member!.id);
		if (!openThread) return this.create();
		if (sync) return this.sync();
		this.patch(openThread);
		return this.open();
	}

	public async restoreOpenThreadByID(threadID: number) {
		const thread = await this.client.queries.fetchThreadByID(threadID);
		if (thread) this.patch(thread);
		return this;
	}

	public async restoreThreadByChannelID(channelID: string) {
		const thread = await this.client.queries.fetchThreadByChannelID(channelID);
		if (thread && thread.status === ThreadStatus.Open) this.patch(thread);
		return this;
	}

	public receiveMessage(message: Message, type: InboxMessageType = InboxMessageType.Recipient) {
		const inboxMessage = new InboxMessage(message).setType(type);
		return this.saveMessage(inboxMessage.toJSON());
	}

	public reply(message: Message) {
		const replyMessage = new InboxMessage(message).setType(InboxMessageType.Reply);
		return this.saveMessage(replyMessage.toJSON());
	}

	public async open() {
		// Resolve the open thread channel
		let channel: TextChannel | null = null;
		if (this.channelID) channel = this.channel;
		if (!channel) channel = await this.createChannel();
		if (!channel) return this;

		// Move the channel
		channel.setParent(this.client.inbox.incomingThreadCategory);

		// Open the thread
		this.status = ThreadStatus.Open;
		await this.save();

		return this;
	}

	public async close(delay: number = 0) {
		// Schedule the close for later
		if (delay) return this.scheduleClose(delay);

		// Delete the channel
		const { channel } = this;
		if (channel) {
			await channel.send("Closing thread...");
			channel.delete("Thread closed").catch(() => null);
		}

		// Close the thread
		this.status = ThreadStatus.Closed;
		await this.save();

		return this;
	}

	public async cancelClose() {
		const task = this.client.schedule.get(`close_${this.id}`);
		if (task) await task.delete().catch(() => null);
		return this;
	}

	private async scheduleClose(delay: number) {
		await this.cancelClose();
		await this.client.schedule.create(Tasks.CloseThread, delay, {
			id: `close_${this.id}`,
			data: { threadID: this.id }
		});
		return this;
	}

	public async suspend() {
		// Move the channel
		const { channel } = this;
		if (channel) channel.setParent(this.client.inbox.archivedThreadCategory).catch(() => null);

		// Suspend the thread
		this.status = ThreadStatus.Suspended;
		await this.save();
		return this;
	}

	public async unsuspend(channelID: string) {
		const openThread = this.client.inbox.openThreadCache.get(this.member!.id);
		if (openThread) return this;

		const thread = await this.client.queries.fetchThreadByChannelID(channelID);

		if (thread && thread.status === ThreadStatus.Suspended) {
			this.patch(thread);
			return this.open();
		}

		return this;
	}

	public markread() {
		this.read = true;
		return this.save();
	}

	private async create() {
		// Set the ID for this thread
		this.id = this.client.settings!.get(ClientStorage.threadID) + 1;
		this.status = ThreadStatus.Open;

		// Tell the user that we received their message
		await this.client.inbox.sendSystemMessage(this.member!, modmailReceived);

		// Create the thread channel
		await this.createChannel();

		// Update the thread ID
		await this.client.settings!.update(ClientStorage.threadID, this.id);

		// Create thread in the database
		const thread = await this.client.queries.createThread(this.toJSON());
		this.client.inbox.openThreadCache.set(thread.userID, thread);

		return this.restore(false);
	}

	private async sendHeader() {
		const { user, joinedAt, nickname } = this.member!;
		const threads = await this.client.queries.fetchAllThreadsForUser(user.id);
		const embed = new this.client.embed()
			.setThumbnail(this.client.user!.displayAvatarURL())
			.setTitle(`Thread #${this.id}`)
			.setDescription(
				[
					`**Username:** ${user.tag}`,
					`**User ID:** ${user.id}`,
					`**Created On:** ${timestamp.display(user.createdAt)}`,
					`**Joined On:** ${joinedAt ? timestamp.display(joinedAt) : "Unknown"}`,
					`**Nickname:** ${nickname ?? "None"}`,
					"─────────────",
					`User has **${threads.length}** previous logs.`,
					this.messages.length
						? `Channel restored (**${this.messages.length}** missing messages).`
						: null
				].filter(Boolean)
			);

		await this.channel?.send(embed).catch(() => null);

		return this;
	}

	private patch(thread: RawThread) {
		this.status = thread.status;
		this.id = thread.id;
		this.userID = thread.userID;
		this.channelID = thread.channelID;
		this.messages = thread.transcript.messages;
		this.read = thread.transcript.read;

		if (thread.status === ThreadStatus.Open) {
			this.client.inbox.openThreadCache.set(thread.userID, thread);
		} else {
			this.client.inbox.openThreadCache.delete(thread.userID);
		}

		return this;
	}

	private async sync() {
		const thread = await this.client.queries.fetchThreadByID(this.id);
		if (thread) this.patch(thread);
		return this;
	}

	private async save() {
		const thread = await this.client.queries.updateThread(this.toJSON());

		if (thread.status === ThreadStatus.Open) {
			this.client.inbox.openThreadCache.set(thread.userID, thread);
		} else {
			this.client.inbox.openThreadCache.delete(thread.userID);
		}

		return this;
	}

	private async saveMessage(message: RawInboxMessage) {
		await this.cancelClose();
		if ([InboxMessageType.Recipient, InboxMessageType.Reply].includes(message.type))
			await this.sendMessage(message);

		const { channel } = this;
		if (channel) channel.setParent(this.client.inbox.incomingThreadCategory);

		this.messages.push(message);
		this.read = false;
		return this.save();
	}

	private async sendMessage(message: RawInboxMessage) {
		const inboxMessage = new InboxMessage(message);
		const isReplyType = message.type === InboxMessageType.Reply;
		const { channel } = this;

		if (this.member && isReplyType)
			await this.member
				.send(inboxMessage.toEmbed())
				.then(() => inboxMessage)
				.catch(() => inboxMessage.setErrored());

		if (channel) await channel.send(inboxMessage.toEmbed(isReplyType));

		return this;
	}

	private async createChannel(tries: number = 1): Promise<TextChannel | null> {
		if (tries > 5) return null;

		const { inboxGuild, incomingThreadCategory } = this.client.inbox;

		const channelName = "0000".substring(0, 4 - `${this.id}`.length) + this.id;
		const channel = await inboxGuild!.channels
			.create(channelName, {
				parent: incomingThreadCategory
			})
			.catch(() => null);

		if (!channel) return this.createChannel(tries++);

		this.channelID = channel.id;

		// Send the modmail thread header
		await this.sendHeader();

		return channel;
	}

	public get channel() {
		return this.client.channels.cache.get(this.channelID!) as TextChannel;
	}

	public toJSON(): RawThread {
		return {
			status: this.status,
			id: this.id,
			userID: this.userID,
			channelID: this.channelID,
			transcript: { read: this.read, messages: this.messages }
		};
	}
}

export const enum ThreadStatus {
	Waiting,
	Open,
	Closed,
	Suspended
}

export interface RawThread {
	status: ThreadStatus;
	id: number;
	userID: string;
	channelID: string | null;
	transcript: Transcript;
}
