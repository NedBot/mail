import { RawThread, Thread } from "../structures/InboxThread";

export interface CommonQuery {
	fetchAllThreads(): Promise<RawThread[]>;
	fetchThreadByID(threadID: number): Promise<RawThread | undefined>;
	fetchThreadByChannelID(channelID: string): Promise<RawThread | undefined>;
	createThread(thread: RawThread): Promise<RawThread>;
	updateThread(thread: RawThread): Promise<RawThread>;
	fetchAllThreadsForUser(userID: string): Promise<RawThread[]>;
}
