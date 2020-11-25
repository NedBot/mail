import { Argument, KlasaMessage, Possible, Duration } from "klasa";

export default class extends Argument {
	public run(arg: string, possible: Possible, message: KlasaMessage) {
		const {
			args,
			usage: { usageDelim }
			// @ts-ignore 2341
		} = message.prompter!;

		const index = args.indexOf(arg);
		const resolve = index ? args.slice(index) : args;

		for (const [i] of resolve.entries()) {
			const delim = usageDelim || " ";
			const timePattern = (i ? resolve.slice(0, -i) : resolve).join(delim);
			// @ts-ignore 2341
			const match = timePattern.match(Duration.regex);
			const matched = match && match.map((x) => x.replace(/ /g, "")).join("");
			const span = matched && matched === timePattern.split(" ").join("") ? matched : null;
			if (span) {
				args.splice(index, args.length - i - 1 - index);
				return new Duration(span).offset;
			}
		}

		throw message.language.get("RESOLVER_INVALID_DURATION", possible.name);
	}
}
