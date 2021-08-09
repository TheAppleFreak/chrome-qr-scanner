import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers";
import defaultState from "./defaultState";

const store = configureStore({
    reducer: rootReducer,
    preloadedState: defaultState,
});

export default store;
