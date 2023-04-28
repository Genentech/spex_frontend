import { createMuiTheme } from '@material-ui/core/styles';
import { createGlobalStyle } from 'styled-components';
import dark from './dark';
import light from './light';
import 'typeface-roboto';

const themes = {};
export const addTheme = (name, theme) => {
  themes[name] = theme;
};

addTheme(light.name, light);
addTheme(dark.name, dark);

const GlobalStyle = createGlobalStyle`
  html,
  body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  *:not(#id_fake_for_hack) {
    -webkit-font-feature-settings: "liga" on, "calt" on;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-family: 'Roboto', sans-serif;
  }
  
  button:not(#id_fake_for_hack) {
    outline: 0;
  }
  
  .hovered {
    cursor: pointer;
  }
  
  .draggable {
    cursor: grab;
  }
  
  .dragging {
    cursor: grabbing;
  }
`;

export const getTheme = (name) => {
  const theme = createMuiTheme(themes[name] || themes.light);

  return {
    theme,
    GlobalStyle,
  };
};
