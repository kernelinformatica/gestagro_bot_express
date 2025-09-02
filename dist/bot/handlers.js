"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerSaldo = void 0;
exports.handleMessage = handleMessage;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const obtenerSaldo = async (clienteId) => {
    const res = await (0, node_fetch_1.default)('http://10.0.0.204:5070/api/chat/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteId })
    });
    return await res.json();
};
exports.obtenerSaldo = obtenerSaldo;
const commandModules = {};
fs_1.default.readdirSync(path_1.default.join(__dirname, 'commands')).forEach(file => {
    const command = file.replace('.js', '');
    commandModules[command] = require(`./commands/${file}`);
});
async function handleMessage(sock, msg, from, text) {
    const key = Object.keys(commandModules).find(k => text.toLowerCase().includes(k));
    const command = key ? commandModules[key] : commandModules['default'];
    await command(sock, from, text, msg);
}
