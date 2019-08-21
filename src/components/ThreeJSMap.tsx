import React, { useRef, useEffect } from "react";
import { StaticMap } from 'react-map-gl';
import DeckGL from "deck.gl";
import { MapboxLayer } from "@deck.gl/mapbox";
import { MapboxMap } from "./types";
import WebMercatorViewport, {lngLatToWorld} from "viewport-mercator-project";
import { oneLineTrim } from "common-tags";
import SphericalMercator from '@mapbox/sphericalmercator';
import { Map, Marker, Popup, TileLayer, WMSTileLayer, useLeaflet, GridLayer } from 'react-leaflet'

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

interface Props { }

const ConnectedThreeJSMap: React.FC<Props> = (props: Props) => {
  const tiles = useRef(null);

  if (tiles.current) {
    const tileLayer = tiles.current;
    // @ts-ignore
    console.log(tileLayer);
  }

  return (
    <Map center={[51.505, -0.09]} zoom={13} style={{ width: '100%', height: '100vh'}}>
      <TileLayer
        ref={tiles}
        url={`https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
      />
    </Map>
  );
}

export default ConnectedThreeJSMap;
