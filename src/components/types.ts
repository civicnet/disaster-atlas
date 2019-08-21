export interface MapboxMap {
  addLayer: (layer: any, before?: any) => void;
  getStyle: () => any;
  showTileBoundaries: () => any;
}
