const fetch = require('node-fetch');
const fs = require('fs');

const obtenerSaldo = async (clienteId) => {
  const res = await fetch(process.env.API_SALDO_URL+'/api/chat/saldo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: clienteId }),
  });
  return await res.json();
};

const commandModules = {};
fs.readdirSync(path.join(__dirname, 'commands')).forEach((file) => {
  const command = file.replace('.js', '');
  commandModules[command] = require(`./commands/${file}`);
});

const handleMessage = async (sock, msg, from, text) => {
  const key = Object.keys(commandModules).find((k) => text.toLowerCase().includes(k));
  const command = key ? commandModules[key] : commandModules['default'];
  await command(sock, from, text, msg);
};

module.exports = { obtenerSaldo, handleMessage };