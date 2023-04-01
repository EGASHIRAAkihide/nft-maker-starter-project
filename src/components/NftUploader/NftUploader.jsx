import Web3Mint from "../../utils/Web3Mint.json";
import { Web3Storage } from 'web3.storage'
import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ImageLogo from "./image.svg";
import "./NftUploader.css";

const NftUploader = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nftHash, setNftHash] = useState([]);
  console.log("currentAccount: ", currentAccount)

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have Metamask!");
      return;
    } else {
      console.log("We have the etherum object", ethereum)
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("connected", accounts[0]);
    } catch (error) {
      console.log("error", error)
    }
  }

  const askContractToMintNft = async (ipfs) => {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    try {
      setIsLoading(true)
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer,
        );
        console.log("Going to pop wallet now to pay gas...");

        let nftTxn = await connectedContract.mintIpfsNFT("sample", ipfs);
        console.log("Mining...please wait.");

        await nftTxn.wait();
        console.log(`Mined, see transaction: https://sepolia.etherescan.io/tx/${nftTxn.hash}`);
        setNftHash([nftTxn.hash])

        setIsLoading(false)
      } else {
        console.log("Ethereum abject doesn't exist");
        setIsLoading(false)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  )

  const imageToNFT = async (e) => {
    const client = new Web3Storage({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEEyREM3MzY1RUVhMjU0MDQ2QmM5MTI0NTUxMTVDMTIyM0EyOTlBM2UiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODAzNzYyMDQ1NjUsIm5hbWUiOiJuZnQtbWFrZXItc3RhcnRlci10b2tlbiJ9.9_yr0DfLF5Gbes6oCnItsYm0Z84pbN1tGKqhUOxslTc' })
    const image = e.target
    console.log('image', image)

    const rootCid = await client.put(image.files, {
      name: 'experiment',
      maxRetries: 3
    })
    const res = await client.get(rootCid)
    const files = await res.files()
    for (const file of files) {
      console.log("file.cid: ", file.cid)
      askContractToMintNft(file.cid)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="outerBox">
      {currentAccount === ""
        ? (renderNotConnectedContainer())
        : (<p>If you choose image, you can mit your NFT</p>)
      }
      <div className="title">
        <h2>NFTアップローダー</h2>
      </div>
      <div>
        {isLoading && (
          <div>Mining...Please wait</div>
        )}
      </div>
      <div className="nftUplodeBox">
        <div className="imageLogoAndText">
          <img src={ImageLogo} alt="imagelogo" />
          <p>ここにドラッグ＆ドロップしてね</p>
        </div>
        <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT} />
      </div>
      <p>または</p>
      <Button variant="contained">
        ファイルを選択
        <input className="nftUploadInput" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT} />
      </Button>
      <div>
        <h3>アップロード済みのNFT</h3>
        <ul>
          {nftHash.length > 0
            ? nftHash.map((item, index) => (
              <li key={index}>
                <a href={`https://sepolia.etherescan.io/tx/${item}`}>
                  #NFT ${index + 1}
                </a>
              </li>
            ))
            : (
              <li>アップロード済みのNFTはありません</li>
            )}
        </ul>
      </div>
    </div>
  );
};

export default NftUploader;