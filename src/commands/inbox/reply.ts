import { KlasaMessage, CommandOptions } from "klasa";
import { InboxCommand, Init } from "../../lib/structures/Command";
import { InboxMessageReplyFlag } from "../../lib/structures/InboxMessage";
import { Thread } from "../../lib/structures/InboxThread";

@Init<CommandOptions>({ usage: "<message:string>", flagSupport: true })
export default class CloseCommand extends InboxCommand {
	public async handle(message: KlasaMessage, thread: Thread, [response]: [string]) {
		const { anonymous, anon, system, unnamed } = message.flagArgs;
		let replyFlag: InboxMessageReplyFlag | undefined = undefined;
		if (anonymous ?? anon) replyFlag = InboxMessageReplyFlag.Anonymous;
		if (system) replyFlag = InboxMessageReplyFlag.System;
		if (unnamed) replyFlag = InboxMessageReplyFlag.Unnamed;

		message.content = response;
		thread.reply(message, replyFlag);
	}
}
