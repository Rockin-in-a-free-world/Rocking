/**
 * Test file for redelegation example from tutorial
 * Tests: Create a redelegation (Bob → Carol)
 * Based on tutorial.md section "Create a redelegation"
 */

import { bobSmartAccount, carolSmartAccount } from "./config.ts"
import { createDelegation } from '@metamask/smart-accounts-kit'
import { parseUnits } from 'viem'

export async function testRedelegation(signedDelegation: any) {
  console.log("Testing redelegation (Bob → Carol)...\n");

  // Following tutorial.md exactly
  const redelegation = createDelegation({
    scope: {
      type: "erc20TransferAmount",
      tokenAddress: "0xc11F3a8E5C7D16b75c9E2F60d26f5321C6Af5E92",
      // USDC has 6 decimal places.
      maxAmount: parseUnits("5", 6),
    },
    to: carolSmartAccount.address,
    from: bobSmartAccount.address,
    // Signed root delegation from previous step.
    parentDelegation: signedDelegation,
    environment: bobSmartAccount.environment,
  })

  console.log("✓ Redelegation created successfully");
  console.log("  From:", bobSmartAccount.address);
  console.log("  To:", carolSmartAccount.address);
  console.log("  Parent delegation present:", !!redelegation.parentDelegation);

  const signedRedelegation = await bobSmartAccount.signDelegation({ delegation: redelegation })
  
  console.log("✓ Redelegation signed successfully");
  
  console.log("\n✅ Redelegation test passed!");
  
  return signedRedelegation;
}

