import { Task } from "klasa";
import { Thread, ThreadStatus } from "../lib/structures/InboxThread";

export default class extends Task {
	public async run(data: CloseThreadData) {
		const thread = await new Thread(null, this.client).restoreOpenThreadByID(data.threadID);
		if (thread.status !== ThreadStatus.Waiting) this.client.inbox.queue.push(() => thread.close());
	}
}

export interface CloseThreadData {
	id: string;
	threadID: number;
}
