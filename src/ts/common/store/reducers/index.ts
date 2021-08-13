import _set from "lodash/set";

import defaultState from "../defaultState";
import type { ISettings } from "@common/interfaces";

export default function appReducer(
    state: ISettings = defaultState,
    action: TAction,
) {
    switch (action.type) {
        case "SET_SETTINGS": {
            return _set({...state}, action.payload.key, action.payload.value);
        }
        default: {
            return state;
        }
    }
}

export type TAction = {
    type: "SET_SETTINGS",
    payload: {
        key: string,
        value: any
    }
}