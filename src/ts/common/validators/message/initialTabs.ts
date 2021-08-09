import { z } from "zod";

import { Tab, TabGroup } from "../types";

const initialTabs = z.object({
    initialTab: Tab,
    allTabs: Tab.array().nonempty(),
    initialTabGroups: TabGroup.array(),
});

export default initialTabs;
