const { sequelize } = require('./server/index.js');
const { moment } = require('./helper');

if (process.env.TEST !== 'true') {
	sequelize.authenticate().then(() => {
		console.log('PSQL Connection has been established successfully.');
	}).catch((err) => {
		console.error('Unable to connect to the database:', err);
	});
}

async function upsertUser(FBID, userName) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO "chatbot_users" (fb_id, user_name, created_at, updated_at)
  VALUES ('${FBID}', '${userName}', '${date}', '${date}')
  ON CONFLICT (fb_id)
  DO UPDATE
    SET user_name = '${userName}', updated_at = '${date}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${userName} successfully!`);
	}).catch((err) => {
		console.error('Error on upsertUser => ', err);
	});
}

// ----------------------------------------------------------

// CREATE TABLE chatbot_users(
//   id SERIAL PRIMARY KEY,
//   fb_id BIGINT UNIQUE,
//   user_name text NOT NULL,
//   matricula INTEGER,
//   cpf TEXT,
//   created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
//   updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
// );

module.exports = {
	upsertUser,
};
