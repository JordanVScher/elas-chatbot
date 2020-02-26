const { readFileSync } = require('fs');
const { sendHTMLMail } = require('../mailer');
const { sendBroadcastAluna } = require('../broadcast');
const { sentryError } = require('../helper');
const turmas = require('../../server/models').turma;
const warn = require('./warn_admin');

const goBackButton = [{ content_type: 'text', title: 'Voltar', payload: 'mainMenu' }];

async function buildAlunaMail(aluna) {
	let res = 'Olá';

	if (aluna['Nome Aluna']) {
		res += `, ${aluna['Nome Aluna']}`;
	} else {
		res += '.';
	}

	res += '\nParece que falta você preencher alguns formulários para a nossa aula dessa semana:\n';

	const questionarios = [
		'Indicação de Avaliadores (Avaliação 360)',
		'Pré Sondagem de foco',
		'Pós Sondagem de foco',
		'Pré Avaliação 360 (Avaliador)',
		'Pós Avaliação 360 (Avaliador)',
	];

	questionarios.forEach((e) => {
		if (aluna[e] === 'Não Respondido') {
			res += `\n-${e}`;
		}
	});

	return res;
}

async function sendWarningAlunas(test, mod) {
	const today = new Date();
	const allTurmas = await turmas.findAll({ where: {}, raw: true }).then((res) => res).catch((err) => sentryError('Erro em turmas.findAll', err));

	const modulos = await warn.getValidModulos(today, allTurmas, 2, test, mod);
	let content = await warn.GetWarningData(modulos);

	content = await content.filter((x) => x['ID Avaliador'] === null);
	for (let i = 0; i < content.length; i++) {
		const e = content[i];
		const mailText = await buildAlunaMail(e);
		if (mailText) {
			if (e['E-mail Aluna'] && e['E-mail Aluna'].trim()) {
				let html = await readFileSync(`${process.cwd()}/mail_template/ELAS_Generic.html`, 'utf-8');
				html = await html.replace('[CONTEUDO_MAIL]', mailText);
				await sendHTMLMail('Lembrete: Responda os questionários', e['E-mail Aluna'], html, null, mailText);
			}

			if (e['FB da Aluna']) {
				await sendBroadcastAluna(e['FB da Aluna'], mailText, JSON.stringify(goBackButton));
			}
		}
	}
}

module.exports = { sendWarningAlunas };
