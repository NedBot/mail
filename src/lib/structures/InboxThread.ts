import { Client, GuildMember, TextChannel } from "discord.js";
import { ClientStorage } from "../../types/settings/ClientStorage";

export class Thread {
	public client!: Client;
	public member!: GuildMember;
	public status: ThreadStatus = ThreadStatus.Waiting;
	public id: number = 0;
	public channelID: string | null = null;
	public userID: string;

	public constructor(member: GuildMember) {
		Object.defineProperty(this, "client", { value: member.client });
		Object.defineProperty(this, "member", { value: member.user });
		this.userID = member.user.id;
	}

	public restore(sync: boolean): Promise<this> {
		const openThread = this.client.inbox.openThreadCache.get(this.member.id);
		if (!openThread) return this.create();
		if (sync) return this.sync();
		this.patch(openThread);
		return this.open();
	}

	public async open() {
		// Resolve the open thread channel
		let channel: TextChannel | null = null;
		if (this.channelID) channel = this.channel;
		if (!channel) channel = await this.createChannel();
		if (!channel) return this;

		// Open the thread
		this.status = ThreadStatus.Open;
		await this.save();

		return this;
	}

	public async close(_delay: number = 0) {
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
			channelID: this.channelID
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
}
