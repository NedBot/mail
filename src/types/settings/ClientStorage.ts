import { T } from "./Common";

export namespace ClientStorage {
	export const userBlacklist = T<string[]>("userBlacklist");
	export const guildBlacklist = T<string[]>("guildBlacklist");
	export const schedules = T<unknown[]>("schedules");

	export const threadID = T<number>("threadID");
}
