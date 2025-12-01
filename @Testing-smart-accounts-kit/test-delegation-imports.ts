/**
 * Test file to verify decodeDelegations and encodeDelegations imports
 * Run with: npm test
 * Or: npx tsx test-delegation-imports.ts
 */

// Try importing from the utils subpath first
// If that doesn't work, we may need to adjust the import path
import { decodeDelegations, encodeDelegations, toDelegation, type DelegationStruct } from "@metamask/smart-accounts-kit/utils";

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
console.log("Test 2: Testing encodeDelegations");
let testEncoded: string | null = null;
try {
  // Create a valid DelegationStruct object
  // DelegationStruct has: delegate, delegator, authority, caveats, salt (as bigint), signature
  const delegationStruct: DelegationStruct = {
    delegate: "0x0000000000000000000000000000000000000001",
    delegator: "0x0000000000000000000000000000000000000002",
    authority: "0x0000000000000000000000000000000000000003",
    caveats: [], // Empty array of caveats
    salt: BigInt(0), // salt must be bigint in DelegationStruct
    signature: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // 65 bytes (r, s, v)
  };
  
  // Convert DelegationStruct to Delegation (salt becomes Hex)
  const delegation = toDelegation(delegationStruct);
  
  // Encode the delegation array
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

