import { Transaction } from '../wallet';

class MemoryPool{
	constructor(){
		this.transactions = [];	
	}

	addOrUpdate(transaction){
		const { input, outputs = [] } = transaction;

		// Suma todos los totales de los outputs
		const outputTotal = outputs.reduce((total, output) => total + output.amount, 0);

		// Valida que el amount del input sea igual a la suma de todos los outputs
		if(input.amount !== outputTotal)
			throw Error(`Invalid transaction from: ${input.address}`);

		if(! Transaction.verify(transaction))
			throw Error(`Invalid signature from: ${input.address}`);

		const txIndex = this.transactions.findIndex(({ id }) => id === transaction.id );

		if(txIndex >= 0)
			this.transactions[txIndex] = transaction;
		else
			this.transactions.push(transaction);
	}

	find(address){
		return this.transactions.find(({ input }) => input.address === address);
	}

	wipe(){
		this.transactions = [];
	}
}

export default MemoryPool;