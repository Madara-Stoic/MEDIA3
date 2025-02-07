import React, { useState } from "react";
import { SingleNodeClient } from "@iota/iota.js";
import axios from "axios";
import { configureChains, createClient, WagmiConfig, useAccount, useConnect } from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { publicProvider } from "@wagmi/core/providers/public";
import { InjectedConnector } from "@wagmi/core/connectors/injected";

const PINATA_API_KEY = "YOUR_PINATA_API_KEY";
const PINATA_SECRET_KEY = "YOUR_PINATA_SECRET_KEY";

const iotaClient = new SingleNodeClient("https://chrysalis-nodes.iota.org");

const { chains, provider } = configureChains([mainnet], [publicProvider()]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: [new InjectedConnector()],
  provider,
});

function MediaUploader() {
  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();

  const uploadToPinata = async () => {
    if (!isConnected) return alert("Please connect your wallet first");
    if (!file) return alert("Please select a file");
    if (file.size > 50 * 1024 * 1024) return alert("File size exceeds 50MB limit");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      });

      setCid(response.data.IpfsHash);
      await storeOnIOTA(response.data.IpfsHash);
    } catch (error) {
      console.error("Error uploading file to Pinata: ", error);
    }
    setLoading(false);
  };

  const storeOnIOTA = async (cid) => {
    try {
      const message = await iotaClient.messageSubmit({
        payload: {
          type: 2,
          index: new TextEncoder().encode("MediaUpload"),
          data: new TextEncoder().encode(
            JSON.stringify({
              cid,
              owner: address,
              timestamp: new Date().toISOString(),
            })
          ),
        },
      });
      setTransactionId(message.messageId);
    } catch (error) {
      console.error("Error storing metadata on IOTA: ", error);
    }
  };

  return (
    <WagmiConfig client={wagmiClient}>
      <div className="flex flex-col items-center p-6 border rounded-lg shadow-lg w-96 mx-auto">
        <h2 className="text-lg font-bold mb-4">Upload Media to IPFS & IOTA</h2>
        {!isConnected ? (
          <button onClick={() => connect()} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Connect Wallet
          </button>
        ) : (
          <>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-4" />
            <button
              onClick={uploadToPinata}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            {cid && (
              <p className="mt-4 text-sm">
                File CID: <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" className="text-blue-600 underline">{cid}</a>
              </p>
            )}
            {transactionId && (
              <p className="mt-4 text-sm">
                IOTA Tx ID: <a href={`https://explorer.iota.org/mainnet/message/${transactionId}`} target="_blank" className="text-green-600 underline">{transactionId}</a>
              </p>
            )}
          </>
        )}
      </div>
    </WagmiConfig>
  );
}

export default MediaUploader;
