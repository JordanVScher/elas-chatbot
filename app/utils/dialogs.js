// const flow = require('./flow');
const db = require('./DB_helper');

module.exports.handleCPF = async (context) => {
	const cpf = context.state.whatWasTyped.replace(/[_.,-]/g, '');
	if ((cpf.length === 11 && parseInt(cpf, 10)) === false) {
		await context.setState({ dialog: 'invalidCPF' });
	} else if (await db.checkCPF(cpf) === false) { // check if this cpf exists
		await context.setState({ dialog: 'CPFNotFound' });
	} else {
		await db.linkUserToCPF(context.session.user.id, cpf);
		await context.setState({ cpf, gotTurma: await db.getUserTurma(context.session.user.id) });
		await context.setState({ dialog: 'validCPF' });
	}
};
