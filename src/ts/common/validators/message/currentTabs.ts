import { z } from "zod";

// TODO: Figure out better schemas
const currentTabs = z.object({
    initialTab: z.any(),
    allTabs: z.any().array().nonempty(),
    tabGroups: z.any().array(),
});

export default currentTabs;
