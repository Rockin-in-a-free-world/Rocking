/**
 * Test file for root delegation example from tutorial
 * Tests: Create a delegation (Alice → Bob)
 * Based on tutorial.md section "Create a delegation"
 */

import { aliceSmartAccount, bobSmartAccount } from "./config.ts";
import { createDelegation } from '@metamask/smart-accounts-kit'
import { parseUnits } from 'viem'

export async function testRootDelegation() {
  console.log("Testing root delegation (Alice → Bob)...\n");

  // Following tutorial.md exactly
  const delegation = createDelegation({
    scope: {
      type: "erc20TransferAmount",
      tokenAddress: "0xc11F3a8E5C7D16b75c9E2F60d26f5321C6Af5E92",
      // USDC has 6 decimal places.
      maxAmount: parseUnits("10", 6),
    },
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
  })

  console.log("✓ Delegation created successfully");
  console.log("  From:", aliceSmartAccount.address);
  console.log("  To:", bobSmartAccount.address);
  
  const signature = await aliceSmartAccount.signDelegation({ delegation })
  
  console.log("✓ Delegation signed successfully");
  
  // The signed delegation should be the delegation object with signature
  const signedDelegation = {
    ...delegation,
    signature: signature
  };
  
  console.log("\n✅ Root delegation test passed!");
  
  return signedDelegation;
}

