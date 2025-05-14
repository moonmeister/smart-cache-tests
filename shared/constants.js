export const GRAPHQL_PATH = "/index.php?graphql&query={ posts { nodes { id } } }";
export const GET_TTL = /s-maxage=(?<s_ttl>\d+)|max-age=(?!.*s-maxage)(?<m_ttl>\d+)/;
