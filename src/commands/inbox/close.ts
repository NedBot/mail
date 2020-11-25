import { KlasaMessage, CommandOptions } from "klasa";
import { InboxCommand, Init } from "../../lib/structures/Command";
import { Thread } from "../../lib/structures/InboxThread";
import { formatMS } from "../../util";

@Init<CommandOptions>({ usage: "[delay:timespan]" })
export default class CloseCommand extends InboxCommand {
	public async handle(message: KlasaMessage, thread: Thread, [delay]: [number?]) {
		await thread.close(delay);
		if (delay)
			await thread.channel
				?.send(`Scheduled to close in ${formatMS(delay).string}`)
				.catch(() => null);
	}
}
