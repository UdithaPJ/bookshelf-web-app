import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme.tsx";
import { BrowserRouter as Router } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { ClientRequest } from "node:http";
import { client } from "./api/graphql/make-apollo-client.ts";

Amplify.configure({
  Auth: {
    Cognito: {
      //region: process.env.REGION as string,
      userPoolId: process.env.USER_POOL_ID as string,
      userPoolClientId: process.env.USER_POOL_APP_CLIENT_ID as string,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <ApolloProvider client={client}>
        <Authenticator.Provider>
          <CssBaseline>
            <Router>
              <App />
            </Router>
          </CssBaseline>
        </Authenticator.Provider>
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>
);
