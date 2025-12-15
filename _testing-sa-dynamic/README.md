Testing this guide:

http://localhost:3003/smart-accounts-kit/development/guides/smart-accounts/signers/dynamic/#3-create-a-smart-account


# Use Dynamic with MetaMask Smart Accounts

User authenticates with Google SSO (or email, passkey, etc.) → Dynamic creates an EOA wallet
That Dynamic EOA wallet becomes the signer for a MetaMask Smart Account
The Smart Account can then perform operations (user operations, gasless transactions, etc.)

**Note:** This guide focuses on integrating Dynamic as a signer. For configuring Dynamic's authentication methods (social login, passkeys, etc.), see the [Dynamic documentation](https://www.dynamic.xyz/docs).


1. renamed files from .ts to .tsx removing syntax alerts
> impacts guide

2. Needed to fix the wagmi version conflict by downgrading to v2
> impacts users, guide could have note


## The app

npm install

npm run dev


Enabled Sepolia in your Dynamic Dashboard:
Go to https://app.dynamic.xyz/dashboard
Navigate to your project settings
Find "Chains" or "Networks" section
Enable "Sepolia Testnet"
