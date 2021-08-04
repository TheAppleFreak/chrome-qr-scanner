import { z } from "zod";
import {
    Message,
    currentTabs,
    getCurrentTabs,
    getInitialTabs,
    getSettings,
    initialTabs,
    setSettings,
    settings,
} from "@common/validators";

// The main one
export type TMessage = z.infer<typeof Message>;

// Ancillary types
export type TCurrentTabs = z.infer<typeof currentTabs>;
export type TGetCurrentTabs = z.infer<typeof getCurrentTabs>;
export type TGetInitialTabs = z.infer<typeof getInitialTabs>;
export type TGetSettings = z.infer<typeof getSettings>;
export type TInitialTabs = z.infer<typeof initialTabs>;
export type TSetSettings = z.infer<typeof setSettings>;
export type TSettings = z.infer<typeof settings>;
