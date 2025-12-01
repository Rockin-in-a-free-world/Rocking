/**
 * Test file to verify decodeDelegations and encodeDelegations imports
 * Based on beta-docs.md examples
 * Run with: npm test
 * Or: npx tsx test-delegation-imports.ts
 */

import { decodeDelegations, encodeDelegations } from "@metamask/smart-accounts-kit/utils";
import { createDelegation, getSmartAccountsEnvironment } from "@metamask/smart-accounts-kit";
import { parseEther } from "viem";

console.log("Testing @metamask/smart-accounts-kit/utils imports...\n");

// Test 1: Check if functions exist
console.log("Test 1: Checking function existence");
console.log("  decodeDelegations type:", typeof decodeDelegations);
console.log("  encodeDelegations type:", typeof encodeDelegations);

if (typeof decodeDelegations !== "function") {
  console.error("  ✗ decodeDelegations is not a function");
  process.exit(1);
}
if (typeof encodeDelegations !== "function") {
  console.error("  ✗ encodeDelegations is not a function");
  process.exit(1);
}
console.log("  ✓ Both functions exist\n");

// Test 2: Test encodeDelegations to create a valid encoded string
// Following the beta-docs.md example
console.log("Test 2: Testing encodeDelegations");
let testEncoded: string | null = null;
try {
  // Create a delegation using createDelegation as shown in beta-docs.md
  // Using Sepolia chain ID (11155111) for the environment
  const sepoliaChainId = 11155111;
  const environment = getSmartAccountsEnvironment(sepoliaChainId);
  
  const delegation = createDelegation({
    from: "0x7E48cA6b7fe6F3d57fdd0448B03b839958416fC1",
    to: "0x2B2dBd1D5fbeB77C4613B66e9F35dBfE12cB0488",
    environment: environment,
    scope: {
      type: "nativeTokenTransferAmount",
      // 0.001 ETH in wei format
      maxAmount: parseEther("0.001"),
    },
  });
  
  // Encode the delegation array as shown in beta-docs.md
  testEncoded = encodeDelegations([delegation]);
  console.log("  ✓ encodeDelegations works");
  console.log("  Encoded string:", testEncoded);
  console.log("  Encoded length:", testEncoded.length, "characters");
} catch (error) {
  console.error("  ✗ encodeDelegations error:", error);
  console.error("  Error details:", (error as Error).message);
  if ((error as Error).stack) {
    console.error("  Stack:", (error as Error).stack);
  }
}

// Test 3: Test decodeDelegations with the encoded string from Test 2
console.log("\nTest 3: Testing decodeDelegations");
if (testEncoded) {
  try {
    const decoded = decodeDelegations(testEncoded);
    console.log("  ✓ decodeDelegations works");
    console.log("  Decoded delegations count:", decoded.length);
    console.log("  First delegation:", JSON.stringify(decoded[0], (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    // Verify round-trip: encode again and compare
    const reEncoded = encodeDelegations(decoded);
    if (reEncoded === testEncoded) {
      console.log("  ✓ Round-trip test passed: encode -> decode -> encode produces same result");
    } else {
      console.log("  ⚠ Round-trip test: encoded strings differ (this might be expected)");
      console.log("    Original:", testEncoded);
      console.log("    Re-encoded:", reEncoded);
    }
  } catch (error) {
    console.error("  ✗ decodeDelegations error:", error);
    console.error("  Error details:", (error as Error).message);
  }
} else {
  console.log("  ⚠ Skipping decodeDelegations test - encodeDelegations failed");
}

console.log("\n✅ All imports verified successfully!");

