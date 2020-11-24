import { Client, GuildMember, Message, TextChannel } from "discord.js";
import { Tasks } from "../../types/Enums";
import { ClientStorage } from "../../types/settings/ClientStorage";
import { InboxMessage, InboxMessageType, RawInboxMessage, Transcript } from "./InboxMessage";

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

	public async restoreOpenThreadByID(threadID: number): Promise<this> {
		const thread = await this.client.queries.fetchThreadByID(threadID);
		if (thread) this.patch(thread);
		return this;
	}

	public async receiveMessage(message: Message) {
		const inboxmessage = new InboxMessage(message).setType(InboxMessageType.Recipient);
		await this.saveMessage(inboxmessage.toJSON());
		return this;
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
		this.channelID = null;
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

		// Create the thread channel
		await this.createChannel();

		// Update the thread ID
		await this.client.settings!.update(ClientStorage.threadID, this.id);

		// Create thread in the database
		const thread = await this.client.queries.createThread(this.toJSON());
		this.client.inbox.openThreadCache.set(thread.userID, thread);

		return this.restore(false);
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

	private saveMessage(message: RawInboxMessage) {
		this.messages.push(message);
		return this.save();
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
		return channel;
	}

	private get channel() {
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
