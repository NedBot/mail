import { Event, EventOptions } from "klasa";
import { Init } from "../util";

@Init<EventOptions>({ once: true })
export default class extends Event {
	public async run() {
		this.client.console.log(`Logged in as ${this.client.user!.tag}`);
		this.client.inbox.init();
	}
}
