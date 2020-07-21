import fs from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { SHA256 } from 'crypto-js';

dotenv.config();

let Helpers = {};

Helpers.getWalletInfo = (type, name) => {

	return new Promise(resolve => {

		let keys = {};
		let token = null;
		let key = null;

		try {

		    if(fs.existsSync(process.cwd() + '/key')) {

		        key = fs.readFileSync(process.cwd() + '/key', {encoding:'utf8', flag:'r'});

		    } else {

		    	let timestamp = Date.now();
		    	let random = Helpers.getRandomArbitrary(1, 5);

		    	key = SHA256(JSON.stringify(`${timestamp}${name}${random}`)).toString();

		    	fs.appendFile(process.cwd() + '/key', key, (err) => {
				  	if (err) 
				  		throw err;
				});
		    }

		    if(key){

		    	fetch(process.env.HOST_SERVER_API + '/wallet/create/miner', { method: 'POST', body: JSON.stringify({key: key}), headers: { 'Content-Type': 'application/json'}})
				    .then(res => res.json())
				    .then(json => {
				    	resolve(json);
				    });
		    }
	    	

		} catch (err) {
		    console.error(err);
		}

	});
};

Helpers.printInfo = (name, peers, blockchain, wallet) => {

	const { memoryPool:  { transactions }, blocks } = blockchain;

	console.clear();
  	console.log(`---------------------------------------------------------------------------------------------------------`);
  	console.log(`> Miner: ${name}`);
	console.log("> Wallet: ", wallet.publicKey);
	console.log("> Balance: ", wallet.currentBalance);
	peers.forEach((peer) => {
		console.log(`> Connected to: ${peer}`);
	});
	console.log(`---------------------------------------------------------------------------------------------------------`);

	if(transactions.length){
		let txs = [];

		transactions.forEach((tx) => {

			tx.outputs.forEach(function(output){

				if (output.address !== tx.input.address) {
					txs.push({
						"Tx": tx.id,
						"Wallet Origin": tx.input.address.substr(0, 20)+'...',
						"Amount": output.amount,
						"Wallet Destiny": output.address.substr(0, 20)+'...'
					});
				}
			});
		});

		console.log("");
		console.log("Memory Pool:");
		console.table(txs);
	}else{
		console.log("");
		console.log("No hay transacciones sin confirmar...");
	}

	if(blocks.length){
		let chain = [];

		blocks.forEach((block) => {

			chain.push({
				"Previous Hash": block.previousHash,
				"Hash": block.hash,
				"Nonce": block.nonce,
				"difficulty": block.difficulty
			});
		});

		console.log("");
		console.log("Blockchain:");
		console.table(chain);
	}else{
		console.log("");
		console.log("No hay bloques...");
	}
};

Helpers.getRandomArbitrary = (max, min) => {
	return Math.random() * (max - min) + min;
}

export default Helpers;