import "../styles/styles.css";
import { ApolloProvider } from "@apollo/react-hooks";
import Head from "next/head";

import { client } from "../config/graphql";

function MyApp({ Component, pageProps }) {
  console.log("_app");

  return (
    <ApolloProvider client={client}>
      <Head>
        <title>Next.js Authentication with HTTP-Onlly Cookies</title>
      </Head>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
