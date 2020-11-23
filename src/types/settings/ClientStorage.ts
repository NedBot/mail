import { T } from "./Common";

export namespace ClientStorage {
	export const userBlacklists = T<string[]>("userBlacklists");
	export const guildBlacklists = T<string[]>("guildBlacklists");
	export const schedules = T<unknown[]>("schedules");

	export const threadID = T<number>("threadID");
}
