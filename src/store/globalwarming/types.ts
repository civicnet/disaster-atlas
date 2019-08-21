export type RegionType = 'UAT' | 'County';

export interface RegionProperties {
  code: string,
  county: string;
  countyCode: string;
  countyMn: string;
  damages: Damages[];
  name: string;
  natLevName: string;
  pop2011: number;
  pop2012: number;
  pop2013: number;
  pop2014: number;
  pop2015: number;
  totalArea: number;
  centroid: {
    latitude: number;
    longitude: number;
  }
}

export interface Region {
  geometry: {
    type: string,
    coordinates: any[],
  };
  properties: RegionProperties,
};

export interface RegionData {
  type: RegionType;
  data: Region[];
}

export type SeaLevel = any;

export interface DamagedBuildingsListing {
  [key: string]: number,
}

export interface Damages {
  seaLevel: number;
  bldgs?: DamagedBuildingsListing;
  area: {
    flooded: number;
    coverage: number;
  }
}

export interface GlobalWarmingState {
  uats: Region[];
  counties: Region[];
  seaLevels: SeaLevel[];
  playback: {
    year: number;
    isPlaying: boolean;
  },
  selectedRegion?: RegionProperties,
}

export const RECEIVE_REGIONS = 'RECEIVE_REGIONS';
export const RECEIVE_SEA_LEVELS = 'RECEIVE_SEA_LEVELS';
export const SET_PLAYBACK_YEAR = 'SET_PLAYBACK_YEAR';
export const TOGGLE_PLAYBACK = 'TOGGLE_PLAYBACK';
export const SET_SELECTED_REGION = 'SET_CURRENT_REGION';
export const CLEAR_SELECTED_REGION = 'CLEAR_CURRENT_REGION';

export interface SetSelectedRegionAction {
  type: typeof SET_SELECTED_REGION;
  selectedRegion: RegionProperties;
}

export interface ClearSelectedRegionAction {
  type: typeof CLEAR_SELECTED_REGION;
}

export interface TogglePlaybackAction {
  type: typeof TOGGLE_PLAYBACK;
}

export interface SetPlaybackYearAction {
  type: typeof SET_PLAYBACK_YEAR;
  year: number;
}

export interface ReceiveRegionsAction {
  type: typeof RECEIVE_REGIONS;
  regions: RegionData;
}

export interface ReceiveSeaLevelsAction {
  type: typeof RECEIVE_SEA_LEVELS;
  levels: any[];
}

export type GlobalWarmingActions =
  ReceiveRegionsAction
  | ClearSelectedRegionAction
  | SetSelectedRegionAction
  | ReceiveSeaLevelsAction
  | SetPlaybackYearAction
  | TogglePlaybackAction;
