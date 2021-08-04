import { z } from "zod";
import { Settings, SettingsPartial } from "@common/validators";

export interface ISettings extends z.infer<typeof Settings> {}
export interface ISettingsPartial extends z.infer<typeof SettingsPartial> {}
