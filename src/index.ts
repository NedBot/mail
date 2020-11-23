import { MailClient } from "./lib/structures/MailClient";
import { CLIENT_OPTIONS } from "./lib/constants";

export const client = new MailClient(CLIENT_OPTIONS);
client.start().catch(client.console.error);
