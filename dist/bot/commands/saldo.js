"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiCliente_1 = require("../../services/apiCliente");
exports.default = async (sock, from) => {
    try {
        const saldo = await (0, apiCliente_1.obtenerSaldo)('1100302');
        await sock.sendMessage(from, { text: saldo.message });
    }
    catch {
        await sock.sendMessage(from, { text: '⚠️ No se pudo obtener el saldo.' });
    }
};
