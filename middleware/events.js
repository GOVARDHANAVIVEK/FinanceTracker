const EventEmitter = require('events')

// class FinanceEventEmitter extends EventEmitter {}
const notifyUser = new EventEmitter();


module.exports = {notifyUser};