const MaAPI = require('../chatbot_api');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./sendAnswer');

async function checkPosition(context) {
	await context.setState({ dialog: 'prompt' });
	console.log('intentName', context.state.intentName);
	switch (context.state.intentName) {
	case 'Default Welcome Intent':
	case 'Greetings': // add specific intents here
		break;
	case 'Fallback': // didn't understand what was typed
		await createIssue(context);
		break;
	default: // default acts for every intent - position on MA
		// getting knowledge base. We send the complete answer from dialogflow
		await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp, context.session.user.id) });
		console.log('knowledge', context.state.knowledge);

		// check if there's at least one answer in knowledge_base
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			await sendAnswer(context);
		} else { // no answers in knowledge_base (We know the entity but politician doesn't have a position)
			await createIssue(context);
		}
		break;
	}
}

module.exports.checkPosition = checkPosition;
