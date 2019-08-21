import {
  GlobalWarmingActions,
  RECEIVE_REGIONS,
  GlobalWarmingState,
  RECEIVE_SEA_LEVELS,
  SET_PLAYBACK_YEAR,
  TOGGLE_PLAYBACK,
  CLEAR_SELECTED_REGION,
  SET_SELECTED_REGION
} from "./types";

const initialState: GlobalWarmingState = {
  uats: [],
  counties: [],
  seaLevels: [],
  playback: {
    year: new Date().getFullYear(),
    isPlaying: false
  }
};

export function GlobalWarmingReducer(
  state = initialState,
  action: GlobalWarmingActions
): GlobalWarmingState {
  switch (action.type) {
    case CLEAR_SELECTED_REGION: {
      return {
        ...state,
        selectedRegion: undefined
      };
    }
    case SET_SELECTED_REGION: {
      return {
        ...state,
        selectedRegion: action.selectedRegion
      };
    }
    case TOGGLE_PLAYBACK:
      return {
        ...state,
        playback: {
          ...state.playback,
          isPlaying: !state.playback.isPlaying
        }
      };
    case SET_PLAYBACK_YEAR:
      return {
        ...state,
        playback: {
          ...state.playback,
          year: action.year
        }
      };
    case RECEIVE_REGIONS:
      if (action.regions.type === "UAT") {
        return {
          ...state,
          uats: action.regions.data
        };
      }

      return {
        ...state,
        counties: action.regions.data
      };
    case RECEIVE_SEA_LEVELS:
      return {
        ...state,
        seaLevels: action.levels
      };
    default:
      return state;
  }
}
