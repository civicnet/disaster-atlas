import React from "react";
import clsx from "clsx";
import { loadCSS } from "fg-loadcss";

import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  useTheme,
  CssBaseline,
  IconButton,
  Theme,
  createStyles,
  Icon,
  createMuiTheme
} from "@material-ui/core";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { ThemeProvider } from "@material-ui/styles";

import { Route, Link, LinkProps } from "react-router-dom";

import { routes } from "./routes";

const globalTheme = createMuiTheme({
  palette: {
    primary: {
      main: "#6a1b9a"
    },
    secondary: {
      main: "#009688"
    }
  }
});

const drawerWidth = 240;
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flex: 1
    },
    list: {
      width: 250
    },
    fullList: {
      width: "auto"
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 36
    },
    hide: {
      display: "none"
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerPaper: {
      backgroundColor: theme.palette.background.paper
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      width: theme.spacing(7) + 1
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 8px",
      ...theme.mixins.toolbar
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3)
    },
    faIcon: {
      width: "unset"
    },
    symbolLogo: {
      height: 32,
      margin: "0 auto",
      display: "inherit"
    },
    logoContainer: {
      padding: theme.spacing(1),
      paddiogTop: theme.spacing(2),
      paddingBottom: theme.spacing(2)
    }
  })
);

interface Props {}

const CollisionLink = (to: string) =>
  React.forwardRef<HTMLAnchorElement, Omit<LinkProps, "innerRef" | "to">>(
    (props, ref) => <Link innerRef={ref as any} to={to} {...props} />
  );

const App: React.FC<Props> = (props: Props) => {
  const classes = useStyles();
  const theme = useTheme();

  const [isDrawerOpen, setDrawerOpen] = React.useState();

  theme.palette.type = "dark";
  React.useEffect(() => {
    loadCSS(
      "https://pro.fontawesome.com/releases/v5.10.1/css/all.css",
      document.querySelector("#font-awesome-css")
    );
  }, []);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <ThemeProvider theme={globalTheme}>
      <div className={classes.root}>
        <CssBaseline />
        <Drawer
          variant="permanent"
          className={clsx(classes.drawer, {
            [classes.drawerOpen]: isDrawerOpen,
            [classes.drawerClose]: !isDrawerOpen
          })}
          classes={{
            paper: clsx(classes.drawerPaper, {
              [classes.drawerOpen]: isDrawerOpen,
              [classes.drawerClose]: !isDrawerOpen
            })
          }}
          open={isDrawerOpen}
        >
          <div className={classes.toolbar}>
            <IconButton
              style={!isDrawerOpen ? { margin: "0 auto", flex: "unset" } : {}}
              onClick={isDrawerOpen ? handleDrawerClose : handleDrawerOpen}
            >
              {isDrawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </div>
          <Divider />
          <div className={classes.logoContainer}>
            {isDrawerOpen ? (
              <img
                alt=""
                src="/logos/logo_color.svg"
                className={classes.symbolLogo}
              />
            ) : (
              <img
                alt=""
                src="/logos/simbol_color.svg"
                className={classes.symbolLogo}
              />
            )}
          </div>
          <Divider />
          <List>
            {routes.map((route, index) => (
              <ListItem
                component={CollisionLink(route.path)}
                button={true}
                key={index}>
                <ListItemIcon>
                  <Icon className={clsx(classes.faIcon, route.icon)} />
                </ListItemIcon>
                <ListItemText primary={route.name} />
              </ListItem>
            ))}
          </List>
        </Drawer>
        <main className={classes.content}>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.main}
            />
          ))}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;
