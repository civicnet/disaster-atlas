import { GlobalWarmingState, GlobalWarmingActions } from "./globalwarming/types";

export interface ReduxAction {
  type: string;
}

export type AllActionTypes =
  GlobalWarmingActions;

export type GlobalReduxState =
  GlobalWarmingState;
