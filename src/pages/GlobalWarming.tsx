import React from "react";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Theme,
  createStyles,
  Icon,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  ListItemAvatar
} from "@material-ui/core";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { getCurrentSeaLevelIdx } from "../components/GlobalWarmingMap";
import { AppState } from "../store";

import { RegionType, GlobalWarmingState, Region } from "../store/globalwarming/types";
import {
  fetchRegions,
  setPlaybackYear,
  togglePlayback
} from "../store/globalwarming/actions";
import { connect } from "react-redux";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flex: 1
    },
    faIcon: {
      width: "unset"
    },
    card: {
      bottom: 100,
      width: 600,
      zIndex: 1000,
      right: 100,
      position: "absolute"
    },
    details: {
      display: "flex",
      flexDirection: "column"
    },
    cover: {
      width: 151
    },
    controls: {
      display: "flex",
      alignItems: "center",
      paddingLeft: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      paddingRight: theme.spacing(3)
    },
    playIcon: {
    },
    cardContent: {
      flex: "1 0 auto"
    },
    stats: {
      width: 600,
      position: "absolute",
      top: 100,
      right: 100,
      color: "#fff"
    },
    statsSecondary: {
      color: "#ABC"
    },
    statsTitle: {
      paddingLeft: 72
    }
  })
);

const YEAR_CHANGE_RATE = 5;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;

const mapStateToProps = (state: AppState) => ({
  globalWarming: state.globalWarming
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchRegions: (type: RegionType) => dispatch(fetchRegions(type)),
  setPlaybackYear: (year: number) => dispatch(setPlaybackYear(year)),
  togglePlayback: () => dispatch(togglePlayback())
});

interface Props {
  globalWarming: GlobalWarmingState;
  fetchRegions: typeof fetchRegions;
  setPlaybackYear: typeof setPlaybackYear;
  togglePlayback: typeof togglePlayback;
}

const ConnectedGlobalWarming: React.FC<Props> = (props: Props) => {
  const classes = useStyles();

  const [animationFrame, setAnimationFrame] = React.useState(0);
  const [seaLevel, setSeaLevel] = React.useState(0);

  React.useEffect(() => {
    let interval: any = null;
    if (props.globalWarming.playback.isPlaying) {
      interval = setInterval(() => {
        setAnimationFrame(animationFrame + 1);

        if (animationFrame !== 0 && animationFrame % YEAR_CHANGE_RATE === 0) {
          if (props.globalWarming.playback.year === 2100) {
            props.togglePlayback();
            return;
          }

          props.setPlaybackYear(props.globalWarming.playback.year + 1);
        }
      }, FRAME_DURATION);
    } else if (
      !props.globalWarming.playback.isPlaying &&
      animationFrame !== 0
    ) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  });

  const setSeaLevelTween = (level: number) => {
    setSeaLevel(level * 10);
  };

  const handleSliderChange = (_: any, value: number | number[]) => {
    if (props.globalWarming.playback.isPlaying) {
      props.togglePlayback();
    }

    props.setPlaybackYear(typeof value === "number" ? value : value[0]);
  };

  const seaLevelIndex = getCurrentSeaLevelIdx(
    props.globalWarming.playback.year,
    props.globalWarming.seaLevels.length
  );

  const damagesForCurrentRegion = props.globalWarming.selectedRegion
    ? (props.globalWarming.selectedRegion.damages || []).find(dmg => {
        return dmg.seaLevel === seaLevelIndex;
      })
    : null;
/*
  const damagesForAll = props.globalWarming.uats.reduce((acc: any, uat: Region) => {
    const damagesForUat = (uat.properties.damages || []).find(dmg => {
      return dmg.seaLevel === seaLevelIndex;
    });

    if (!damagesForUat) {
      return acc;
    }

    const floodedArea = acc.floodedArea + damagesForUat.area.flooded;
    const totalArea = acc.totalArea + uat.properties.totalArea;
    const population = acc.population + uat.properties.pop2015;
    const bldgs = acc.bldgs + Number(damagesForUat.bldgs);
    const coverage = Number((floodedArea * 100) / totalArea).toFixed(2);
    const refugees = Math.round((Number(coverage) / 100) * population);

    return {
      floodedArea,
      totalArea,
      coverage,
      bldgs,
      population,
      refugees,
    }
  }, {
    floodedArea: 0,
    totalArea: 0,
    coverage: 0,
    bldgs: 0,
    population: 0,
    refugees: 0,
  });
   */
  return (
    <>
      <Map setSeaLevel={setSeaLevelTween} />
      {damagesForCurrentRegion && (
        <div className={classes.stats}>
          <Typography
            variant="h5"
            component="h5"
            className={classes.statsTitle}
          >
            {props.globalWarming.selectedRegion &&
              props.globalWarming.selectedRegion.name}
          </Typography>
          <Typography
            variant="subtitle1"
            component="span"
            className={classes.statsTitle}
          >
            Județul{" "}
            {props.globalWarming.selectedRegion &&
              props.globalWarming.selectedRegion.county}
          </Typography>

          <List>
            <ListItem>
              <ListItemAvatar>
                <Icon className={clsx("fal fa-ruler-combined")} />
              </ListItemAvatar>
              <ListItemText
                classes={{
                  secondary: classes.statsSecondary
                }}
                primary={`${(
                  damagesForCurrentRegion.area.flooded * 1.0e-6
                ).toFixed(2)} km²`}
                secondary="Suprafața de teren acoperită de apă"
              />
            </ListItem>

            <ListItem>
              <ListItemAvatar>
                <Icon className={clsx("fal fa-chart-pie-alt")} />
              </ListItemAvatar>
              <ListItemText
                classes={{
                  secondary: classes.statsSecondary
                }}
                primary={`${damagesForCurrentRegion.area.coverage.toFixed(2)}%`}
                secondary="Proporție totală acoperită de apă"
              />
            </ListItem>

            <ListItem>
              <ListItemAvatar>
                <Icon className={clsx(classes.faIcon, "fal fa-house-flood")} />
              </ListItemAvatar>
              <ListItemText
                classes={{
                  secondary: classes.statsSecondary
                }}
                primary={
                  damagesForCurrentRegion.bldgs
                    ? damagesForCurrentRegion.bldgs["other"]
                    : 0
                }
                secondary="Numărul de clădiri inundate"
              />
            </ListItem>

            <ListItem>
              <ListItemAvatar>
                <Icon className={clsx(classes.faIcon, "fal fa-hiking")} />
              </ListItemAvatar>
              <ListItemText
                classes={{
                  secondary: classes.statsSecondary
                }}
                primary={
                  props.globalWarming.selectedRegion
                    ? Math.floor(
                        props.globalWarming.selectedRegion.pop2015 *
                          (damagesForCurrentRegion.area.coverage / 100)
                      )
                    : 0
                }
                secondary="Numărul de persoane evacuate"
              />
            </ListItem>
          </List>
        </div>
      )}

      <Card className={classes.card}>
        <div className={classes.details}>
          <CardContent className={classes.cardContent}>
            <Typography component="h1" variant="h3">
              {props.globalWarming.playback.year}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Nivelul mării estimat la {seaLevel}mm
            </Typography>
          </CardContent>

          <div className={classes.controls}>
            <Grid container spacing={2}>
              <Grid item>
                <IconButton
                  aria-label="play/pause"
                  onClick={props.togglePlayback}
                >
                  {props.globalWarming.playback.isPlaying ? (
                    <Icon className={clsx(classes.playIcon, "fal fa-pause")} />
                  ) : (
                    <Icon className={clsx(classes.playIcon, "fal fa-play")} />
                  )}
                </IconButton>
              </Grid>
              <Grid item xs style={{ alignSelf: "center" }}>
                <Slider
                  value={props.globalWarming.playback.year}
                  min={new Date().getFullYear()}
                  max={2100}
                  step={1}
                  onChange={handleSliderChange}
                  aria-labelledby="continuous-slider"
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </div>
        </div>
      </Card>
    </>
  );
};

const GlobalWarming = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedGlobalWarming);

export default GlobalWarming;
