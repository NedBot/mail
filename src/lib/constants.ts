import { KlasaClientOptions } from "klasa";
import { clientCommandPrefix } from "../config";
import { Permissions } from "../types/Enums";

export const CLIENT_OPTIONS: KlasaClientOptions = {
	console: { utc: true, useColor: true, timestamps: "DD/MM/YY HH:mm:ss" },
	customPromptDefaults: { quotedStringSupport: true },
	consoleEvents: { verbose: true, debug: true },
	providers: { default: "mongodb" },
	schedule: { interval: 10000 },

	prefix: clientCommandPrefix,
	prefixCaseInsensitive: true,
	slowmode: 600,
	slowmodeAggressive: true,
	commandMessageLifetime: 900,

	messageCacheLifetime: 1200,
	messageSweepInterval: 900,
	messageCacheMaxSize: 50,

	createPiecesFolders: false,
	disabledCorePieces: ["commands"],

	disableMentions: "everyone",
	partials: ["MESSAGE", "REACTION", "CHANNEL"],
	ws: {
		intents: [
			"GUILDS",
			"GUILD_MEMBERS",
			"GUILD_BANS",
			"GUILD_MESSAGES",
			"GUILD_MESSAGE_REACTIONS",
			"DIRECT_MESSAGES"
		]
	},
	pieceDefaults: {
		commands: {
			extendedHelp: "",
			flagSupport: false,
			permissionLevel: Permissions.Everyone,
			quotedStringSupport: true,
			runIn: ["text", "news"]
		},
		monitors: {
			ignoreOthers: false,
			ignoreBots: false,
			ignoreSelf: false,
			ignoreBlacklistedUsers: false
		}
	}
};
