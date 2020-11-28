import { KlasaMessage, Monitor } from "klasa";
import { DMChannel } from "discord.js";
import { Thread, ThreadStatus } from "../lib/structures/InboxThread";
import { InboxMessageType } from "../lib/structures/InboxMessage";

export default class extends Monitor {
	public async run(message: KlasaMessage) {
		const isInboxGuild = message.guild && message.guild.id === this.client.inbox.inboxGuild!.id;

		if (isInboxGuild && (message.author.bot ? !message.embeds.length : true)) {
			this.client.inbox.queue.push(async () => {
				// Resolve the thread (if any)
				const thread = new Thread(null, this.client);
				await thread.restoreThreadByChannelID(message.channel.id);

				// Save the chat/command
				const messageType = message.command ? InboxMessageType.Command : InboxMessageType.Chat;
				if (thread.status !== ThreadStatus.Waiting)
					await thread.receiveMessage(message, messageType);
				return thread;
			});
		} else if (!message.guild && !message.author.bot) {
			// Register DMs
			if ((message.channel as DMChannel).partial) await message.channel.fetch();
			this.client.inbox.registerMessage(message);
		}
	}
}
