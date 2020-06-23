import  webSocket from 'ws';
import Helpers from '../tools';

//const { P2P_PORT = 5000, PEERS } = process.env;
//const peers = PEERS ? PEERS.split(",") : [];

const MESSAGE = { 
	BLOCKS: 'blocks',
	TX: 'transaction',
	WIPE: 'wipe_memoryPool'
};

class P2PService{
	constructor(port, peers, name, blockchain, wallet){
		this.port = port;
		this.peers = peers;
		this.name = name;
		this.blockchain = blockchain;
		this.wallet = wallet;
		this.sockets = [];
	}

	listen(){

		let peers = this.peers;

		// Crea una instancia de webSocket en el puerto por defecto (5000)
		const server = new webSocket.Server({port:this.port});

		// Cuando se reciba una conexion de un cliente
		server.on('connection', (socket) => this.onConnection(socket));

		// Por cad peer intento establecer una conexion
		peers.forEach((peer) => {
			const socket = new webSocket(peer);

			// Por cada peer llamo a onConneciton para guardar en la instancia ese socket
			socket.on("open", () => this.onConnection(socket));
		});
	}

	onConnection(socket){
		const { name, peers, blockchain, wallet } = this;

		// Se almacena el nuevo socket en un array para enviar mensajes a futuro (Broadcast).
		this.sockets.push(socket);

		// Cuando recibo el mensaje, obtengo una lista de bloque del nodo al que me he contacto
		// Luego intento reemplazar esa lista de bloque por la lista de la instancia actual
		socket.on("message", (message) => {

			const { type, value } = JSON.parse(message);

			
				if(type === MESSAGE.BLOCKS)
					blockchain.replace(value);
				else if(type === MESSAGE.TX)
					blockchain.memoryPool.addOrUpdate(value);
				else if(type === MESSAGE.WIPE)
					blockchain.memoryPool.wipe();
				try{
			}catch(error){
				console.log(`[ws:message] error ${error}`);
				//throw Error(error);
			}

			Helpers.printInfo(name, peers, blockchain, wallet);
		});

		// Cuando se establece una conexion se envia a ese nodo los bloques que tiene la instancia actual
		socket.send(JSON.stringify({ type: MESSAGE.BLOCKS, value:blockchain.blocks }));
	}

	sync(){
		const {blockchain: { blocks } } = this;

		// Envio un mensaje a todos los nodos de la red con los bloques de la instancia actual
		this.broadcast(MESSAGE.BLOCKS, blocks);
	}

	broadcast(type, value){
		console.log(`[ws:broadcast] ${type}...`);
		const message = JSON.stringify({type, value});

		this.sockets.forEach((socket) => socket.send(message));
	}
}


export  { MESSAGE };
export default P2PService;