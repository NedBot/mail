import { KlasaMessage, Monitor } from "klasa";
import { DMChannel } from "discord.js";

export default class extends Monitor {
	public async run(message: KlasaMessage) {
		if (message.guild) return;
		if ((message.channel as DMChannel).partial) await message.channel.fetch();
		this.client.inbox.registerMessage(message);
	}
}
