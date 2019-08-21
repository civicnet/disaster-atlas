#!/usr/bin/env node

const { oneLineTrim } = require("common-tags");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const Turf = require("@turf/turf");
const { intersection } = require("martinez-polygon-clipping");
const memoize = require("memoizee");

const STATIC_ASSETS_RELEASE_VERSION = "0.1.0";
const STATIC_ASSETS_REPO = "geojson-romania";
const STATIC_ASSETS_REPO_USER = "ClaudiuCeia";

const STATIC_ASSETS_HOST = oneLineTrim`https://cdn.jsdelivr.net/gh/
  ${STATIC_ASSETS_REPO_USER}/
  ${STATIC_ASSETS_REPO}@
  ${STATIC_ASSETS_RELEASE_VERSION}
  /generated/`;

const fetchStaticAsset = async asset => {
  const items = await fetch(`${STATIC_ASSETS_HOST}${asset}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  return items.json();
};

const getSeaLevelFilepath = level => {
  if (typeof level === "number") {
    level = level.toFixed(1);
  }
  return path.join(__dirname, `../public/data/${level}.json`);
};

const reduceBuildingsByType = buildings => {
  if (buildings.length === 0) {
    return null;
  }

  const buildingsSummary = {};
  buildings.forEach(building => {
    const tags = building.tags || {};
    let key =
      tags.building !== "yes" && tags.building !== undefined
        ? tags.building
        : tags.designation ||
          tags.amenity ||
          (tags.shop && "shop") ||
          (building.leisure && "leisure") ||
          (building.name && "business") ||
          "other";

    if (tags["addr:housenumber"] || tags["addr:postcode"]) {
      key = "residential";
    }

    if (buildingsSummary[key]) {
      buildingsSummary[key] = buildingsSummary[key] + 1;
    } else {
      buildingsSummary[key] = 1;
    }
  });

  return buildingsSummary;
};

const storeData = (data, filename) => {
  const finalPath = path.resolve(__dirname, `generated/${filename}`);

  try {
    fs.writeFileSync(finalPath, JSON.stringify(data), "utf8");
  } catch (err) {
    console.error(err);
  }
};

const fetchData = async () => {
  const parsedUATs = await fetchStaticAsset("uats.json");
  const parsedCounties = await fetchStaticAsset("counties.json");
  const buildings = JSON.parse(
    fs.readFileSync("generated/floodedBuildings.json", "utf8")
  );

  const levels = [...Array(22).fill(null)].map((_, idx) =>
    idx ? (idx / 10 - 0.3).toFixed(1) : `-0.3`
  );

  const seaLevelsResponse = levels.map(level =>
    JSON.parse(fs.readFileSync(getSeaLevelFilepath(level), "utf8"))
  );

  return {
    uats: parsedUATs,
    counties: parsedCounties,
    buildings: buildings,
    seaLevels: seaLevelsResponse
  };
};

const getBaselineFloodForRegion = memoize((region, baseSeaLevel) => {
  return intersection(
    baseSeaLevel.features[0].geometry.coordinates,
    region.geometry.coordinates
  );
});

const getIntersectedRegions = (regions, seaLevels, seaLevel = 0) => {
  // console.log(`Parsing ${regions.length} regions: `);
  const intersectedRegions = regions
    .map((region, idx) => {
      const coords = intersection(
        seaLevels[seaLevel].features[0].geometry.coordinates,
        region.geometry.coordinates
      );

      const baselineCoords = getBaselineFloodForRegion(region, seaLevels[0]);

      let res = 0;
      if (coords) {
        const currentLevelRes = Turf.area(Turf.multiPolygon(coords));
        let baselineRes = 0;
        if (baselineCoords) {
          baselineRes = Turf.area(Turf.multiPolygon(baselineCoords));
        }
        res = currentLevelRes - baselineRes;
      }

      if (!res) {
        return null;
      }

      const total = Turf.area(region.geometry);
      const coverage = (res * 100) / total;

      return {
        ...region,
        properties: {
          ...region.properties,
          code: region.properties.natcode || region.properties.countyCode,
          totalArea: total,
          damages: [
            {
              seaLevel: seaLevel,
              area: {
                flooded: res,
                coverage: coverage
              }
            }
          ]
        }
      };
    })
    .filter(inters => !!inters);

  // return intersectedRegions.reduce((acc, area) => acc + area, 0) * 1.0e-6;
  return intersectedRegions;
};

const reduceEnhancedRegions = regions => {
  return regions.reduce((acc, seaLevelRegions) => {
    const getRegionFromAcc = code => {
      return acc.find(val => val.properties.code === code);
    };

    return seaLevelRegions.map(region => {
      const previousLevelRegion = getRegionFromAcc(region.properties.code);
      if (previousLevelRegion) {
        return {
          ...previousLevelRegion,
          properties: {
            ...previousLevelRegion.properties,
            damages: [
              ...previousLevelRegion.properties.damages,
              ...region.properties.damages
            ]
          }
        };
      }

      return region;
    });
  }, []);
};

const getIntersectedBuildingsForCoords = (coords, buildings) => {
  let buildingsContained = [];

  for (const bldg of buildings) {
    if (!bldg.lat || !bldg.lon) {
      continue;
    }

    const point = Turf.point([bldg.lon, bldg.lat]);

    if (
      Turf.booleanPointInPolygon(
        point,
        coords
        // Turf.polygon(coords),
      )
    ) {
      buildingsContained.push(bldg);
    }
  }
  return buildingsContained;
};

/**
 * For each region:
 * {
 *    geometry: [...]
 *    properties: {
 *      ...properties,
 *      damages: [{
 *        seaLevel: 0.1,
 *        // restrict to only specific types (schools, institutions, residential, business)
 *        buildings: [{
 *          type: '...',
 *          count: '...',
 *        }],
 *        floodArea: 1234, // sq m
 *        evacuations: 4321, // people (floodArea * pop. density)
 *      }]
 *    }
 * }
 */
const run = async () => {
  const { uats, counties, buildings, seaLevels } = await fetchData();

  console.log(
    "Loaded data",
    {
      uats: uats.length,
      counties: counties.length,
      buildings: buildings.length,
      seaLevels: seaLevels.length
    },
    "\nFiltering flooded regions:"
  );

  // console.log(intersectedCountiesArea, intersectedUATsArea);

  let enhancedUATs = [];
  let enhancedCounties = [];

  const OFFSET = 0;
  // Enhance regions with flood data
  for (const level of seaLevels.keys()) {
    enhancedCounties.push(
      getIntersectedRegions(counties, seaLevels, level + OFFSET)
    );
    enhancedUATs.push(getIntersectedRegions(uats, seaLevels, level + OFFSET));

    process.stdout.write(
      `\rProcessed level ${level}: ${
        enhancedCounties[level].length
      } counties, ${enhancedUATs[level].length} UATs`
    );
  }

  console.log("\n");

  console.log(`Reducing enhanced regions: `);
  enhancedUATs = reduceEnhancedRegions(enhancedUATs);
  enhancedCounties = reduceEnhancedRegions(enhancedCounties);

  /* We're loading the filtered buildings directly from file now

  console.log(`Filtering flooded buildings:`);
  const filteredBuildings = getIntersectedBuildingsForCoords(
    seaLevels[seaLevels.length - 1].features[0].geometry.coordinates,
    buildings,
  );

  console.log(`Saving ${filteredBuildings.length} to "floodedBuildings.json":`);
  storeData(filteredBuildings, 'floodedBuildings.json'); */

  let assignedBuildings = [];
  console.log(`Assigning buildings to regions:`);
  enhancedUATs = enhancedUATs.map(uat => {
    const intersectedBldgs = getIntersectedBuildingsForCoords(
      uat.geometry,
      buildings
    );

    const enhancedDamages = uat.properties.damages.map(damage => {
      const intersectedBldgsForLevel = getIntersectedBuildingsForCoords(
        seaLevels[damage.seaLevel].features[0].geometry,
        intersectedBldgs
      );

      return {
        ...damage,
        bldgs: reduceBuildingsByType(intersectedBldgsForLevel)
      };
    });

    console.log(
      `Assigning ${intersectedBldgs.length} bldgs to ${
        uat.properties.name
      }: ${JSON.stringify(reduceBuildingsByType(intersectedBldgs))}`
    );

    assignedBuildings = [...assignedBuildings, intersectedBldgs];
    return {
      ...uat,
      properties: {
        ...uat.properties,
        damages: enhancedDamages
      }
    };
  });

  console.log(`Saving enhanced UATs`);
  storeData(enhancedUATs, "enhancedUATs.json");

  console.log(`Saving enhanced counties`);
  storeData(enhancedCounties, "enhancedCounties.json");
  /* for (const uat of enhancedUATs) {
    for (const dmg of uat.properties.damages) {
      if (dmg.bldgs.length > 0) {
        console.log(`\n${JSON.stringify(dmg)}`);
      }
    }
  } */

  //console.log(/* enhancedCounties[0], */ JSON.stringify(enhancedCounties[0].properties, true));

  /* for (const uat of enhancedUATs) {

  } */

  /* bldgs: intersectedBuildingsForCounties && intersectedBuildingsForCounties.bldgs,
    }); */
};

run();
