import React from 'react';
import GlobalWarming from "../pages/GlobalWarming";
// import ConnectedThreeJSMap from '../components/ThreeJSMap';

export const routes = [
  {
    path: "/dataviz/",
    exact: true,
    sidebar: () => null,
    main: () => <GlobalWarming />,
    icon: 'fal fa-water',
    name: 'Schimbări climatice',
  },
  {
    path: "/dataviz/avalanche/",
    sidebar: () => null,
    main: () => <GlobalWarming />,
    icon: 'fal fa-mountain',
    name: 'Risc de avalanșă',
  },
];
