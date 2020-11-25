import { PieceOptions, Piece, Store } from "klasa";
import { Constructor } from "discord.js";

export function createClassDecorator(fn: Function) {
	return fn;
}

export function Init<T extends PieceOptions>(options: T) {
	return createClassDecorator(
		(target: Constructor<Piece>) =>
			class extends target {
				public constructor(
					store: Store<string, Piece, typeof Piece>,
					file: string[],
					directory: string
				) {
					super(store, file, directory, options);
				}
			}
	);
}

export function formatMS(ms: number) {
	const times = {
		day: Math.floor(ms / 86400000),
		hour: Math.floor(ms / 3600000) % 24,
		minute: Math.floor(ms / 60000) % 60,
		second: Math.floor(ms / 1000) % 60
	};

	const plural = (x: number) => (x !== 1 ? "s" : "");
	const humanised = Object.entries(times)
		.filter((x) => x[1])
		.map((time) => `${Math.round(time[1])} ${time[0]}${plural(time[1])}`);
	return { ...times, string: replaceLastCommaWithAnd(humanised.join(", ")) };
}

export function replaceLastCommaWithAnd(string: string) {
	return string.replace(/,\s([^,]+)$/, " and $1");
}
