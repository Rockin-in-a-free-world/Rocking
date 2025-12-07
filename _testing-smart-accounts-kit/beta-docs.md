## `decodeDelegations`

Decodes an ABI-encoded hex string to an array of delegations.

### Parameters

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `encoded` | `Hex` | Yes |  The ABI encoded hex string to decode. |

### Example

```ts
import { decodeDelegations } from "@metamask/smart-accounts-kit/utils";

const delegations = decodeDelegations("0x7f0db33d..c06aeeac");
```

## `deployDeleGatorEnvironment`

Deploys the Delegation Framework contracts to an EVM chain.
	@@ -303,7 +321,7 @@ import { parseEther } from "viem";
export const delegation = createDelegation({
  from: "0x7E48cA6b7fe6F3d57fdd0448B03b839958416fC1",
  to: "0x2B2dBd1D5fbeB77C4613B66e9F35dBfE12cB0488",
  environment: getSmartAccountsEnvironment(sepolia.id),
  scope: {
    type: "nativeTokenTransferAmount",
    // 0.001 ETH in wei format.
	@@ -315,6 +333,50 @@ export const delegation = createDelegation({
</TabItem>
</Tabs>

## `encodeDelegations`

Encodes an array of delegations to an ABI-encoded hex string.

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `delegations` | `Delegation[]` | Yes | The delegation array to be encoded. |

### Example

<Tabs>
<TabItem value="example.ts">

```ts
import { encodeDelegations } from "@metamask/smart-accounts-kit/utils";
import { delegation } from "./delegation.ts";

const encodedDelegations = encodeDelegations([delegation]);
```

</TabItem>
<TabItem value="delegation.ts">

```ts
import { createDelegation } from "@metamask/smart-accounts-kit";
import { sepolia } from "viem/chains";
import { parseEther } from "viem";

export const delegation = createDelegation({
  from: "0x7E48cA6b7fe6F3d57fdd0448B03b839958416fC1",
  to: "0x2B2dBd1D5fbeB77C4613B66e9F35dBfE12cB0488",
  environment: getSmartAccountsEnvironment(sepolia.id),
  scope: {
    type: "nativeTokenTransferAmount",
    // 0.001 ETH in wei format.
    maxAmount: parseEther("0.001"),
  },
});
```

</TabItem>
</Tabs>
