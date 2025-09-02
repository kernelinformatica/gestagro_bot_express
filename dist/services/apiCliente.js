"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerSaldo = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const obtenerSaldo = async (clienteId) => {
    const res = await (0, node_fetch_1.default)('http://10.0.0.204:5070/api/chat/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteId })
    });
    return await res.json();
};
exports.obtenerSaldo = obtenerSaldo;
