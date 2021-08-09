import { z } from "zod";
import { Color } from ".";

export const TabGroup = z.object({
    collapsed: z.boolean(),
    color: Color,
    id: z.number().int(),
    title: z.string().optional(),
    windowId: z.number().int(),
});
