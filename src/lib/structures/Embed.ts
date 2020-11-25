import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import { Colors } from "../../types/Enums";

export default class extends MessageEmbed {
	public constructor(data?: MessageEmbed | MessageEmbedOptions) {
		super(data);
		this.setDefaultColor();
	}

	public setDefaultColor() {
		this.setColor(Colors.Default);
		return this;
	}

	public setGreen() {
		this.setColor(Colors.Green);
		return this;
	}

	public setOrange() {
		this.setColor(Colors.Orange);
		return this;
	}

	public setRed() {
		this.setColor(Colors.Red);
		return this;
	}
}
