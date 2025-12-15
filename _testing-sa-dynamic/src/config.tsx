import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { sepolia } from "viem/chains";
import { metaMask } from "wagmi/connectors";

export const queryClient = new QueryClient();

export const connectors = [metaMask()];

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [sepolia.id]: http(),
  },
});