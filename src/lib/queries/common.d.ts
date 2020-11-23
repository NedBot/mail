import { RawThread } from "../structures/InboxThread";

export interface CommonQuery {
	fetchAllThreads(): Promise<RawThread[]>;
}
