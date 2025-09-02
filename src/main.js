const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { startBot } = require('./bot/index');
require('./api/server');
startBot();