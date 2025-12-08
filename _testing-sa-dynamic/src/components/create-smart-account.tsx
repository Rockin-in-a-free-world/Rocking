import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useEffect, useState } from "react";

export function CreateSmartAccount() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function createAccount() {
      // Additional check to make sure the Dynamic wallet is connected
      // and values are available.
      if (!address || !walletClient || !publicClient) {
        setError("Please connect your wallet first");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Guide code - kept exactly as shown
        const account = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          deployParams: [address, [], [], []],
          deploySalt: "0x",
          signer: { walletClient },
        });
        
        setSmartAccount(account);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create smart account");
      } finally {
        setLoading(false);
      }
    }

    if (address && walletClient && publicClient) {
      createAccount();
    }
  }, [address, walletClient, publicClient]);

  if (!address) {
    return <div>Please connect your wallet to create a smart account</div>;
  }

  if (loading) {
    return <div>Creating smart account...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (smartAccount) {
    return (
      <div>
        <h2>Smart Account Created!</h2>
        <p>Address: {address}</p>
        <p>Smart account is ready to use</p>
      </div>
    );
  }

  return <div>Initializing...</div>;
}
