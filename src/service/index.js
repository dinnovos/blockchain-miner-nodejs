import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

import Blockchain from '../blockchain';
import P2PService, { MESSAGE } from './p2p';
import Wallet, { TYPE } from '../wallet';
import Helpers from '../tools';
import Miner from '../miner';
import fs from 'fs';

const { setIntervalAsync } = require('set-interval-async/dynamic');

let envConfig = fs.readFileSync(process.cwd() + '/env.json');
let config = JSON.parse(envConfig);

const { NAME, HTTP_PORT = 3000, P2P_PORT = 5000, PEERS } = config;

const app = express();

let walletContainer = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(HTTP_PORT, async () => {

	// Obtiene las keys para la wallet
	const walletInfo = await Helpers.getWalletInfo(TYPE.MINER, NAME);
	const blockchain = new Blockchain();

	const {publicKey, keyPair, balance} = walletInfo;

	const blockchainWallet = new Wallet(blockchain, 1000000, {}, TYPE.BLOCKCHAIN);

	const wallet = new Wallet(blockchain, balance, {publicKey: publicKey, keyPair: keyPair});

	const p2pService = new P2PService(P2P_PORT, PEERS, NAME, blockchain, wallet);
	const miner = new Miner(blockchain, p2pService, wallet);

	// Cada 10 segundos mina un bloque
	setIntervalAsync(async () => {
		try{
			const block = miner.mine(blockchainWallet);
			console.log("Mining...");
		}catch(error){
			console.log("Error: ", error.message);
		}

		Helpers.printInfo(NAME, PEERS, blockchain, wallet);

	}, 30000);

	walletContainer.push(wallet);

  	p2pService.listen();
});