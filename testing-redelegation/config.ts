import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit"
import { privateKeyToAccount } from "viem/accounts"
import { createPublicClient, http } from "viem"
import { sepolia as chain } from "viem/chains"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Validate that private keys are set
if (!process.env.ALICE_PRIVATE_KEY || !process.env.BOB_PRIVATE_KEY || !process.env.CAROL_PRIVATE_KEY) {
  throw new Error("Missing required environment variables: ALICE_PRIVATE_KEY, BOB_PRIVATE_KEY, CAROL_PRIVATE_KEY")
}

// Use Infura RPC if API key is provided, otherwise use public RPC
const rpcUrl = process.env.INFURA_API_KEY 
  ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  : undefined

const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
})

const aliceAccount = privateKeyToAccount(process.env.ALICE_PRIVATE_KEY as `0x${string}`)
const bobAccount = privateKeyToAccount(process.env.BOB_PRIVATE_KEY as `0x${string}`)
const carolAccount = privateKeyToAccount(process.env.CAROL_PRIVATE_KEY as `0x${string}`)

export const aliceSmartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [aliceAccount.address, [], [], []],
  deploySalt: "0x",
  signer: { account: aliceAccount },
})

export const bobSmartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [bobAccount.address, [], [], []],
  deploySalt: "0x",
  signer: { account: bobAccount },
})

export const carolSmartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [carolAccount.address, [], [], []],
  deploySalt: "0x",
  signer: { account: carolAccount },
})

