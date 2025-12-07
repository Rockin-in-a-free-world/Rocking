/**
 * Complete tutorial test - runs both root delegation and redelegation tests
 * This file tests the complete tutorial flow from tutorial.md
 */

import { testRootDelegation } from "./test-delegation.ts";
import { testRedelegation } from "./test-redelegation.ts";

async function runTests() {
  try {
    // Run root delegation test first
    const signedDelegation = await testRootDelegation();
    
    // Run redelegation test with the signed delegation
    await testRedelegation(signedDelegation);
    
    console.log("\n🎉 All tutorial tests completed successfully!");
  } catch (error) {
    console.error("Test execution failed:", error);
    if (error instanceof Error) {
      console.error("  Message:", error.message);
      if (error.stack) {
        console.error("  Stack:", error.stack);
      }
    }
    process.exit(1);
  }
}

runTests();

