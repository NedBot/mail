import { KlasaMessage, Command, CommandOptions } from "klasa";
import { Permissions } from "../../types/Enums";
import { Thread } from "./InboxThread";
import { Init } from "../../util";
import { CommandStore } from "klasa";

export abstract class InboxCommand extends Command {
	public constructor(
		store: CommandStore,
		file: string[],
		directory: string,
		options: CommandOptions = {}
	) {
		super(store, file, directory, { ...options, permissionLevel: Permissions.Responder });
	}

	public async run(message: KlasaMessage, params: unknown[]) {
		const thread = new Thread(null, this.client);
		await thread.restoreOpenThreadByChannelID(message.channel.id);
		if (thread) return this.handle(message, thread, params);
	}

	public abstract handle(message: KlasaMessage, thread: Thread, params: unknown[]): Promise<any>;
}

export { Init };