const help = require('./helper');
const answers = require('./respostas');
const mailer = require('./mailer');

const preCadastroUrl = process.env.FORM_PRECADASTRO;

/*
    Mock das respostas que vem da planilha do google. Cada chave foi definida lá, o nome das perguntas vem do próprio formulário
    As respostas chegem através do /spread
*/
const bodyMock = {
	nome_sheet: 'Pré-Cadastro',
	timestamp: '2019-05-29T17:27:32.457Z',
	respostas:
    [{ pergunta: 'Nome', resposta: 'Jon Arbuckle' }, { pergunta: 'Empresa', resposta: 'Paws, Inc. ' }, { pergunta: 'Cargo', resposta: 'Cartoonist' }, { pergunta: 'Endereço de e-mail', resposta: 'jordan@appcivico.com' }],
};

async function handleNewAnswer(body) {
	const email = {};
	switch (body.nome_sheet) {
	case 'Pré-Cadastro':
		email.sendTo = await answers.getMail(body.respostas);
		email.newUrl = await answers.gerarNovaUrl(await answers.preparaRespostas(preCadastroUrl, answers.preCadastroMap, body.respostas), preCadastroUrl);
		email.subject = `${body.nome_sheet} respondido`;
		email.text = `Olá${await answers.getName(body.respostas)} Você respondeu o ${body.nome_sheet}. No link abaixo você poderá ver como é possível preencher algumas respostas previamente.\n\n${email.newUrl}`;
		break;
	default:
		console.log('Default em handleNewAnswer', JSON.stringify(body, null, 2)); help.Sentry.captureMessage('Default em handleNewAnswer');
		break;
	}


	mailer.sendTestMail(email.subject, email.text, email.sendTo);
}

// handleNewAnswer(bodyMock);


// module.exports = {
// 	handleNewAnswer,
// };
