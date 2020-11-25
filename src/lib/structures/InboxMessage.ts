import { Message } from "discord.js";
import Embed from "./Embed";

export class InboxMessage {
	public type: InboxMessageType | null = null;
	public author: InboxMessageAuthor | null = null;
	public content: string | null = null;
	public attachments: InboxMessageAttachment[] = [];
	public replyFlag: InboxMessageReplyFlag = InboxMessageReplyFlag.Default;
	public isAlert = false;
	public errored = false;

	public constructor(message?: RawInboxMessage | Message) {
		if (message) this.patch(message);
	}

	public setType(type: InboxMessageType) {
		this.type = type;
		return this;
	}

	public setAuthor(author: InboxMessageAuthor) {
		this.author = author;
		return this;
	}

	public setContent(content: Message | string) {
		this.content = content instanceof Message ? content.content : content;
		return this;
	}

	public setAttachments(message: Message) {
		const attachments = message.attachments.map((attachment) => ({
			name: attachment.name ?? "unknown.png",
			url: attachment.proxyURL ?? attachment.url
		}));
		this.attachments = attachments as InboxMessageAttachment[];
		return this;
	}

	public setReplyFlag(replyFlag: InboxMessageReplyFlag) {
		this.replyFlag = replyFlag;
		return this;
	}

	public setAlert() {
		this.isAlert = true;
		return this;
	}

	public setErrored() {
		this.errored = true;
		return this;
	}

	public toEmbed(isInboxMessage = false) {
		const embed = new Embed().setThumbnail(this.author!.avatar).setDescription(this.toString());
		if (this.isAlert) embed.setOrange();
		if (this.errored) embed.setRed();
		else if (isInboxMessage) embed.setGreen();
		return embed;
	}

	public toString() {
		const { author } = this;
		let username: string | null = null;
		if (author && this.replyFlag !== InboxMessageReplyFlag.Anonymous) username = author.name;
		if (this.replyFlag === InboxMessageReplyFlag.System) username = "System";
		if (this.replyFlag === InboxMessageReplyFlag.Unnamed) username = null;

		const context = [
			username ? `**${username}**` : null,
			username ? "─────────────" : null,
			this.content,
			this.attachments.length ? "**__Attachments__**" : null,
			this.attachments.map((attachment) => `[${attachment.name}](${attachment.url})`).join("\n")
		];

		return context.filter(Boolean).join("\n");
	}

	public toJSON(): RawInboxMessage {
		return {
			type: this.type ?? InboxMessageType.Reply,
			author: this.author,
			content: this.content ?? "",
			attachments: this.attachments,
			replyFlag: this.replyFlag,
			isAlert: this.isAlert,
			errored: this.errored
		};
	}

	private patch(message: RawInboxMessage | Message) {
		if (message instanceof Message) {
			this.author = {
				id: message.author.id,
				name: message.author.tag,
				avatar: message.author.displayAvatarURL()
			};

			this.setContent(message);
			this.setAttachments(message);
		} else {
			this.type = message.type;
			this.author = message.author;
			this.content = message.content;
			this.attachments = message.attachments;
			this.replyFlag = message.replyFlag;
			this.isAlert = message.isAlert;
			this.errored = message.errored;
		}

		return this;
	}
}

export const enum InboxMessageType {
	Chat,
	Command,
	System,
	Recipient,
	Reply
}

export const enum InboxMessageReplyFlag {
	Default,
	Anonymous,
	System,
	Unnamed
}

export interface RawInboxMessage {
	type: InboxMessageType;
	author: InboxMessageAuthor | null;
	content: string;
	attachments: InboxMessageAttachment[];
	replyFlag: InboxMessageReplyFlag;
	isAlert: boolean;
	errored: boolean;
}

export interface InboxMessageAuthor {
	id: string;
	name: string;
	avatar: string;
}

export interface InboxMessageAttachment {
	name: string;
	url: string;
}

export interface Transcript {
	messages: RawInboxMessage[];
	read: boolean;
}
