import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { sepolia } from "viem/chains";

export const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(),
  },
});