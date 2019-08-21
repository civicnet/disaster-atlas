import { combineReducers, createStore, applyMiddleware, compose } from "redux";
import { GlobalWarmingReducer } from "./globalwarming/reducers";
import { ReduxAction, AllActionTypes } from "./types";
import thunk from "redux-thunk";

import { createLogger } from "redux-logger";

const rootReducer = combineReducers({
  globalWarming: GlobalWarmingReducer
});
export type AppState = ReturnType<typeof rootReducer>;

const actionSanitizer = (action: ReduxAction) => {
  switch (action.type) {
    default:
      return action;
  }
};

const stateSanitizer = (state: AppState) => {
  return state;
};

const reduxDevtoolsExtensionOptions = {
  actionSanitizer,
  stateSanitizer
};
const composeEnhancers =
  ((window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
      reduxDevtoolsExtensionOptions
    )) ||
  compose;

const logger = createLogger({
  collapsed: true,
  predicate: (getState: () => AppState, action: AllActionTypes) => {
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    const filteredActionTypes: any[] = [];
    if (filteredActionTypes.includes(action.type)) {
      return false;
    }

    return true;
  }
});

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk, logger))
);

export default store;
