const config = require('config');
const winston = require('winston');
const mongoose = require('mongoose');
mongoose.set('debug', true);


module.exports = function () {
  const db = config.get('dbMlab');

  mongoose.connect(db)
    .then(() => winston.info(`Connected to ${db}...`))
    .catch((err) => winston.error( `Failed to connect to ${db} `, err ));
}