export const communityConfig = {
  communityId: import.meta.env.VITE_COMMUNITY_ID as string,
  tagline: import.meta.env.VITE_COMMUNITY_TAGLINE as string,
  rpcNodes: (import.meta.env.VITE_STEEM_RPC_NODES as string).split(','),
  rpcTimeout: Number(import.meta.env.VITE_STEEM_RPC_TIMEOUT),
};
