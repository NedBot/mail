import { RawThread, Thread } from "../structures/InboxThread";

export interface CommonQuery {
	fetchAllThreads(): Promise<RawThread[]>;
	fetchThreadByID(threadID: number): Promise<RawThread | undefined>;
	createThread(thread: RawThread): Promise<RawThread>;
}
