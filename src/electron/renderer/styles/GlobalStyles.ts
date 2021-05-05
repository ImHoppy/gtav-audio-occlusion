import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Montserrat', Arial, Helvetica, sans-serif;
    font-size: 16px;
    color: #FFF;
  }

  h1 {
    font-weight: 400;
  }
`;