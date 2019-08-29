require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
// const env = process.env.ENV || 'development';
// const config = require('./../config/config.json')[env];

const config = require('./../config/config.js');

const db = {};

let sequelize = '';
if (process.env.TEST !== 'true') {
	sequelize = new Sequelize(config.database, config.username, config.password, {
		host: config.host,
		port: config.port,
		dialect: config.dialect,
	});

	fs
		.readdirSync(__dirname)
		.filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
		.forEach((file) => {
			const model = sequelize.import(path.join(__dirname, file));
			// console.log(model);
			db[model.name] = model;
		});

	Object.keys(db).forEach((modelName) => {
		if (db[modelName].associate) {
			db[modelName].associate(db);
		}
	});
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
