import { PermissionLevels } from "klasa";
import { Permissions } from "../../types/Enums";

export default new PermissionLevels()

	// Everyone has permission
	.add(Permissions.Everyone, () => true)

	// Inbox responder have permission
	.add(Permissions.Responder, () => true);
