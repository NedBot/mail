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
