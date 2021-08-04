import { z } from "zod";

import currentTabs from "./currentTabs";
import getCurrentTabs from "./getCurrentTabs";
import getInitialTabs from "./getInitialTabs";
import getSettings from "./getSettings";
import initialTabs from "./initialTabs";
import setSettings from "./setSettings";
import settings from "./settings";

const Message = z.union([
    z.object({
        msgType: z.literal("currentTabs"),
        data: currentTabs,
    }),
    z.object({
        msgType: z.literal("getCurrentTabs"),
        data: getCurrentTabs,
    }),
    z.object({
        msgType: z.literal("getInitialTabs"),
        data: getInitialTabs,
    }),
    z.object({
        msgType: z.literal("getSettings"),
        data: getSettings,
    }),
    z.object({
        msgType: z.literal("initialTabs"),
        data: initialTabs,
    }),
    z.object({
        msgType: z.literal("checkPermissionsConflict"),
        data: z.undefined(),
    }),
    z.object({
        msgType: z.literal("permissionsConflict"),
        data: z.boolean(),
    }),
    z.object({
        msgType: z.literal("setSettings"),
        data: setSettings,
    }),
    z.object({
        msgType: z.literal("settings"),
        data: z.object({ settings }),
    }),
]);

export {
    Message,
    currentTabs,
    getCurrentTabs,
    getInitialTabs,
    getSettings,
    initialTabs,
    setSettings,
    settings,
};
