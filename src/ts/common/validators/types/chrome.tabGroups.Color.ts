import { z } from "zod";

export const Color = z.enum([
    "grey",
    "blue",
    "red",
    "yellow",
    "green",
    "pink",
    "purple",
    "cyan",
]);
