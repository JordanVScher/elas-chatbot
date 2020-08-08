const { sendMainMenu } = require('./dialogs');

const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

module.exports.createFalarDonnaTimer = async (userID, context) => {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await context.sendText('Tudo bem, qualquer dúvida é só me mandar!');
		await sendMainMenu(context);
		delete FollowUps[userID]; // deleting this timer from timers object
	}, 1000 * 20);
};

module.exports.deleteTimers = async (userID) => {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
};
