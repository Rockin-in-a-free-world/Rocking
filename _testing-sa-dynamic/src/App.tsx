import { CreateSmartAccount } from "./components/create-smart-account";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

function App() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>MetaMask Smart Accounts with Dynamic</h1>
      <p>This app tests the guide code for using Dynamic signer with MetaMask Smart Accounts.</p>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Step 1: Connect Wallet</h2>
        <DynamicWidget />
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2>Step 2: Create Smart Account</h2>
        <CreateSmartAccount />
      </div>
    </div>
  );
}

export default App;

