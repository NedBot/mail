import { Thread } from "./InboxThread";

export class InboxQueue {
	public isProcessing: boolean = false;
	public items: QueueItem[] = [];

	public get length() {
		return this.items.length;
	}

	public push(item: QueueItem) {
		this.items.push(item);
		if (!this.isProcessing) this.run();
	}

	private async run() {
		this.isProcessing = true;
		const item = this.items.shift();

		if (!item) {
			this.isProcessing = false;
			return;
		}

		try {
			await item();
		} catch (error) {
			console.error(error);
		} finally {
			await this.run();
		}
	}
}

export type QueueItem = () => Promise<Thread>;
