import { z } from "zod";

const Settings = z.object({
    // Permissions stuff
    permissions: z.object({
        authorizedTabsScopes: z.boolean(),
    }),

    // Popup general settings
    popup: z.object({
        closeOnBlur: z.boolean(),
        defaultTab: z.enum(["generate", "scan"]),
        theme: z.enum(["system", "dark", "light"]),
    }),

    // Generation settings
    generate: z.object({
        engine: z.enum(["qrcode", "awesome-qr"]),
    }),

    // Scan settings
    scan: z.object({
        maxDetectionFrequency: z.number().positive().max(60),
        startWebcamImmediately: z.boolean(),
    }),
});
const SettingsPartial = Settings.deepPartial();

export { Settings, SettingsPartial };
