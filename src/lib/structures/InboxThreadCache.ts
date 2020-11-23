import { Client, Collection } from "discord.js";
import { RawThread, ThreadStatus } from "./InboxThread";

export class ThreadCache extends Collection<string, RawThread> {
	public async init(client: Client) {
		const threads = await client.queries.fetchAllThreads();

		for (const thread of threads) {
			if (thread.status === ThreadStatus.Open) {
				this.set(thread.userID, thread);
			}
		}

		return this;
	}
}
