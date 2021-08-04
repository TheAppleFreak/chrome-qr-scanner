import { z } from "zod";

const getSettings = z.string().array().optional();

export default getSettings;
