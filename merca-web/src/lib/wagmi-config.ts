import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { MORPH_HOODI } from "./merca-config";

export const wagmiConfig = createConfig({
  chains: [MORPH_HOODI],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [MORPH_HOODI.id]: http("https://rpc-hoodi.morph.network"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
