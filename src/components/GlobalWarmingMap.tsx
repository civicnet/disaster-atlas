import React, { useRef, useEffect } from "react";
import DeckGL from "deck.gl";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { StaticMap } from "react-map-gl";
import { MapboxLayer } from "@deck.gl/mapbox";

import centroid from "@turf/centroid";

import "mapbox-gl/dist/mapbox-gl.css";
import { AppState } from "../store";
import {
  RegionType,
  GlobalWarmingState,
  Region,
  RegionProperties
} from "../store/globalwarming/types";
import {
  fetchRegions,
  fetchSeaLevels,
  clearSelectedRegion,
  setSelectedRegion
} from "../store/globalwarming/actions";
import { connect } from "react-redux";

import * as d3 from "d3-ease";
import { MapboxMap } from "./types";

const INITIAL_VIEW_STATE = {
  width: window.innerWidth,
  height: window.innerHeight,
  longitude: 29.4026143,
  latitude: 44.5968449,
  zoom: 7.6,
  maxZoom: 20,
  minZoom: 6,
  bearing: 0,
  pitch: 0
};

const mapStateToProps = (state: AppState) => ({
  globalWarming: state.globalWarming
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchRegions: (type: RegionType) => dispatch(fetchRegions(type)),
  fetchSeaLevels: () => dispatch(fetchSeaLevels()),
  setSelectedRegion: (region: RegionProperties) => dispatch(setSelectedRegion(region)),
  clearSelectedRegion: () => dispatch(clearSelectedRegion()),
});

interface Props {
  globalWarming: GlobalWarmingState;
  fetchRegions: typeof fetchRegions;
  fetchSeaLevels: typeof fetchSeaLevels;
  setSelectedRegion: typeof setSelectedRegion;
  clearSelectedRegion: typeof clearSelectedRegion;

  setSeaLevel: (level: number) => void;
}

export const getCurrentSeaLevelIdx = (year: number, maxLevel: number) => {
  let seaLevelIndex = Math.round((year - new Date().getFullYear()) / 4.5);
  if (seaLevelIndex >= maxLevel) {
    seaLevelIndex = maxLevel - 1;
  }

  return seaLevelIndex;
};

const ConnectedMap: React.FC<Props> = (props: Props) => {
  const [gl, setGl] = React.useState();

  const map = useRef(null);
  const deck = useRef(null);

  const onWebGLInitialized = (gl: any) => {
    setGl(gl);
  };

  const getMap = (): MapboxMap | null => {
    if (!map.current) {
      return null;
    }

    // @ts-ignore
    return map.current.getMap();
  };

  const onMapLoad = () => {
    const currentMap = getMap();
    if (!currentMap) {
      return;
    }

    const layers = currentMap.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    let waterSymbolIdx = 0;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id === "water") {
        waterSymbolIdx = i;
        break;
      }
    }

    currentMap.addLayer(
      new MapboxLayer({
        id: "sea-level",
        // @ts-ignore
        deck: deck.current.deck
      }),
      layers[waterSymbolIdx + 1].id
    );

    currentMap.addLayer(
      new MapboxLayer({
        id: "geojson-layer-uats",
        // @ts-ignore
        deck: deck.current.deck
      }),
      "sea-level"
    );

    currentMap.addLayer(
      new MapboxLayer({
        id: "scatter",
        // @ts-ignore
        deck: deck.current.deck
      })
    );
  };

  const {
    fetchRegions,
    fetchSeaLevels
  } = props;

  useEffect(() => {
    fetchRegions("County");
    fetchRegions("UAT");
    fetchSeaLevels();
  }, [fetchRegions, fetchSeaLevels]);

  if (
    !props.globalWarming.seaLevels.length ||
    !props.globalWarming.counties.length ||
    !props.globalWarming.uats.length
  ) {
    return null;
  }

  const seaLevelIndex = getCurrentSeaLevelIdx(
    props.globalWarming.playback.year,
    props.globalWarming.seaLevels.length
  );

  const currentSeaLevel = props.globalWarming.seaLevels.length
    ? props.globalWarming.seaLevels[seaLevelIndex]
    : { type: "Polygon" };

  props.setSeaLevel(seaLevelIndex * 10);

  const getDamagesForRegion = (d: any) => {
    const damages = d.properties.damages;
    if (!damages) {
      return 0;
    }

    const currentDamage = damages.find(
      (dmg: any) => dmg.seaLevel === seaLevelIndex
    );
    if (!currentDamage) {
      return 0;
    }

    // return currentDamage.area.coverage;

    const bldgs = currentDamage.bldgs;
    if (!bldgs) {
      return 0;
    }

    return Object.keys(bldgs).reduce((acc, bldgType) => {
      return acc + bldgs[bldgType];
    }, 0);
  };

  let layers = [
    new GeoJsonLayer({
      id: "geojson-layer-uats",
      data: props.globalWarming.uats,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthScale: 1,
      lineWidthMinPixels: 1,
      getLineColor: (d: any) => {
        const current = props.globalWarming.selectedRegion;
        if (!current) {
          return [0, 0, 0, 0];
        }

        if (d.properties.code === current.code) {
          return [255, 255, 255, 255];
        }

        return [0, 0, 0, 0];
      },
      getLineWidth: 1,
      getPolygon: (d: any) => ({
        type: "FeatureCollection",
        features: [d]
      }),
      updateTriggers: {
        getLineColor: props.globalWarming.selectedRegion,
      }
    }),
    new GeoJsonLayer({
      id: "geojson-layer-counties",
      data: props.globalWarming.counties,
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthScale: 1,
      lineWidthMinPixels: 1,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 2,
      getPolygon: (d: any) => ({
        type: "FeatureCollection",
        features: [d]
      }),
      visible: false
    }),
    new GeoJsonLayer({
      id: "sea-level",
      data: currentSeaLevel,
      pickable: false,
      stroked: false,
      filled: true,
      getPolygonOffset: () => [0, 100],
      getFillColor: (d: any, foo: any) => {
        return [0, 105, 148];
      },
      opacity: 0.5,
      transitions: {
        getFillColor: {
          duration: 600,
          easing: d3.easeLinear,
          // enter: 0,
          enter: (value: any) => [value[0], value[1], value[2], 0] // fade in
        }
      }
    }),
    new ScatterplotLayer({
      id: "scatter",
      data: props.globalWarming.uats,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 0, 0, 128],
      filled: true,
      stroked: true,
      radiusScale: 4,
      getPolygonOffset: () => {
        return [0, -100];
      },
      radiusMaxPixels: 40,
      lineWidthMaxPixels: 4,
      lineWidthMaxixels: 2,
      lineWidthUnits: "pixels",
      getRadius: (d: any) => {
        return getDamagesForRegion(d);
      },
      getLineWidth: (d: any) => {
        const dmgs = getDamagesForRegion(d);
        if (dmgs) {
          return 1;
        } else {
          return null;
        }
      },
      getFillColor: (d: any) => {
        if (props.globalWarming.selectedRegion) {
          if (props.globalWarming.selectedRegion.code === d.properties.code) {
            return [255, 0, 0, 128];
          }
        }

        return [255, 0, 0, 70];
      },
      getLineColor: [255, 0, 0, 255],
      getPosition: (d: any) => {
        const pos = centroid(d);
        return pos.geometry ? pos.geometry.coordinates : null;
      },
      onClick: ({ object }: { object: Region } ) => {
        if (!object) {
          return;
        }

        props.setSelectedRegion(object.properties);
      },
      updateTriggers: {
        getRadius: seaLevelIndex,
        getFillColor: props.globalWarming.selectedRegion
      },
      transitions: {
        getRadius: {
          duration: 300,
          easing: d3.easeElasticIn.amplitude(1.75).period(1),
          enter: 0
        }
      }
    })
  ];

  const mapboxStyleURL =
    process.env.NODE_ENV === "production"
      ? "mapbox://styles/claudiuc/cjzfv9blf11q21cphdwsik2tr/draft"
      : "mapbox://styles/claudiuc/cjzfv9blf11q21cphdwsik2tr/draft";

  return (
    <DeckGL
      ref={deck}
      layers={layers}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      onWebGLInitialized={onWebGLInitialized}
    >
      {gl && (
        <StaticMap
          width="100%"
          height="100%"
          // reuseMaps={true}
          preventStyleDiffing={true}
          ref={map}
          mapStyle={mapboxStyleURL}
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          gl={gl}
          onLoad={onMapLoad}
        />
      )}
    </DeckGL>
  );
};

const Map = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedMap);

export default Map;
