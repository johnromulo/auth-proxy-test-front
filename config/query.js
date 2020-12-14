import gql from "graphql-tag";

export const GET_USER = gql`
  query GetUser($id: Int!) {
    user(id: $id) {
      id
      name
      knowledge {
        language
        frameworks
      }
    }
  }
`;
