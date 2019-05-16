const flow = require('./flow');

module.exports.handleCPF = async (context) => {
	const cpf = context.state.whatWasTyped.replace(/[_.,-]/g, '');
	if (cpf.length === 11 && parseInt(cpf, 10)) {
		await context.setState({ cpf, dialog: 'validCPF' });
	} else {
		await context.setState({ dialog: 'invalidCPF' });
		await context.sendText(flow.jaSouAluna.invalidCPF1);
		await context.sendText(flow.jaSouAluna.invalidCPF2);
	}
};
