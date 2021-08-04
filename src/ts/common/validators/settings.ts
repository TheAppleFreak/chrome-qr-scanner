import { z } from "zod";
import { fallback } from "./fallback";

const Settings = z.object({
    authorizedTabsScopes: z.boolean(),
    closeOnBlur: z.boolean(),
    defaultTab: z.enum(["generate", "scan"]),
});
const SettingsPartial = Settings.partial();

export { Settings, SettingsPartial };
