import { z } from "zod";

// TODO: Figure out better schemas
const initialTabs = z.object({
    initialTab: z.any(),
    allTabs: z.any().array().nonempty(),
    initialTabGroups: z.any().array(),
});

export default initialTabs;
