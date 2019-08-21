import {
  RECEIVE_REGIONS,
  ReceiveRegionsAction,
  RegionData,
  SeaLevel,
  ReceiveSeaLevelsAction,
  RECEIVE_SEA_LEVELS,
  GlobalWarmingState,
  RegionType,
  SetPlaybackYearAction,
  SET_PLAYBACK_YEAR,
  TogglePlaybackAction,
  TOGGLE_PLAYBACK,
  SET_SELECTED_REGION,
  SetSelectedRegionAction,
  CLEAR_SELECTED_REGION,
  ClearSelectedRegionAction,
  RegionProperties
} from "./types";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

export function receiveRegions(regions: RegionData): ReceiveRegionsAction {
  return {
    type: RECEIVE_REGIONS,
    regions
  };
}

export function receiveSeaLevels(levels: SeaLevel[]): ReceiveSeaLevelsAction {
  return {
    type: RECEIVE_SEA_LEVELS,
    levels
  };
}

export function togglePlayback(): TogglePlaybackAction {
  return {
    type: TOGGLE_PLAYBACK,
  }
}

export function setPlaybackYear(year: number): SetPlaybackYearAction {
  return {
    type: SET_PLAYBACK_YEAR,
    year
  }
}

export function setSelectedRegion(
  region: RegionProperties,
): SetSelectedRegionAction {
  return {
    type: SET_SELECTED_REGION,
    selectedRegion: region
  }
}

export function clearSelectedRegion(): ClearSelectedRegionAction {
  return {
    type: CLEAR_SELECTED_REGION,
  }
}

const STATIC_ASSETS_HOST = `${process.env.PUBLIC_URL}/data/`;

const fetchStaticAsset = async (asset: string) => {
  const items = await fetch(`${STATIC_ASSETS_HOST}${asset}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  return items.json();
};

export const fetchRegions = (
  type: RegionType
): ThunkAction<void, GlobalWarmingState, null, Action<string>> => async (
  dispatch,
  getState
) => {
  let regionData: RegionData; // = [];
  if (type === "County") {
    if (getState().counties) {
      return Promise.resolve();
    }

    const regions = await fetchStaticAsset("enhancedCounties.json");
    regionData = {
      type: 'County',
      data: regions,
    };

  } else {
    if (getState().uats) {
      return Promise.resolve();
    }

    const regions = await fetchStaticAsset("enhancedUATs.json");
    regionData = {
      type: 'UAT',
      data: regions,
    };

  }

  dispatch(receiveRegions(regionData));
};

export const fetchSeaLevels = (
): ThunkAction<void, GlobalWarmingState, null, Action<string>> => async (
  dispatch,
  getState
) => {
  if (getState().seaLevels) {
    return Promise.resolve();
  }

  const levels = [...Array(22).fill(null)].map((_, idx) =>
    idx ? (idx / 10 - 0.3).toFixed(1) : `-0.3`
  );

  const getSeaLevelFilepath = (level: number | string) => {
    if (typeof level === "number") {
      level = level.toFixed(1);
    }
    return `${process.env.PUBLIC_URL}/data/sea_levels/${level}.json`;
  };

  const seaLevelsResponse = await Promise.all(
    levels.map(level =>
      fetch(getSeaLevelFilepath(level), {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }).then(response => response.json())
    )
  );

  dispatch(receiveSeaLevels(seaLevelsResponse));
}
