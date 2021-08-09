import defaultState from "../defaultState";
import type { ISettings } from "@common/interfaces";

export default function appReducer(
    state: ISettings = defaultState,
    action: any,
) {
    switch (action.type) {
        // TODO: Add cases

        default: {
            return state;
        }
    }
}
