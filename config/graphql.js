import ApolloClient, { InMemoryCache } from "apollo-boost";
import fetch from "isomorphic-unfetch";

const resolvers = {
  Mutation: {
    setCartId: (_root, variables, { cache }) => {
      cache.writeData({
        data: {
          cartId: variables.input,
        },
      });

      return null;
    },
  },
};

// const validatePublishPath = (path) => {
//     const restrictedPaths = {
//         login: true,
//         changePassword: true,
//     };

//     const hasPathString = !!(path && Array.isArray(path) && path.length && path[0]);
//     if (hasPathString) {
//         const [requestPath] = path;
//         if (requestPath in restrictedPaths) return false;
//     }

//     return true;
// };

export const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
  fetch,
  cache: new InMemoryCache(),
  onError: ({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.warn(`Message: ${message}, Path: ${path}`);
      });
    }
    if (networkError) {
      console.warn(`[Network]: ${networkError}`);
    }
  },
  resolvers,
});
