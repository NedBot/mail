import { Client, GuildMember } from "discord.js";

export class Thread {
	public client!: Client;
	public member!: GuildMember;
	public status: ThreadStatus = ThreadStatus.Waiting;

	public constructor(member: GuildMember) {
		Object.defineProperty(this, "client", { value: member.client });
		Object.defineProperty(this, "member", { value: member.user });
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
	userID: string;
}
