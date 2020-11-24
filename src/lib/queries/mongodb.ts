import { KlasaClient } from "klasa";
import { Databases } from "../../types/Enums";
import { RawThread } from "../structures/InboxThread";
import { CommonQuery } from "./common";

export class MongoCommonQuery implements CommonQuery {
	public client!: KlasaClient;

	public constructor(client: KlasaClient) {
		Object.defineProperty(this, "client", { value: client });
	}

	public get provider() {
		return this.client.providers.default;
	}

	public fetchAllThreads() {
		return this.provider.getAll(Databases.Threads) as Promise<RawThread[]>;
	}

	public fetchThreadByID(threadID: number) {
		const query = JSON.stringify({ id: threadID });
		return this.provider.get(Databases.Threads, query) as Promise<RawThread | undefined>;
	}

	public async createThread(thread: RawThread) {
		const query = JSON.stringify({ id: thread.id });
		await this.provider.create(Databases.Threads, query, thread);
		return thread;
	}

	public async updateThread(thread: RawThread) {
		const query = JSON.stringify({ id: thread.id });
		await this.provider.update(Databases.Threads, query, thread);
		return thread;
	}
}
