const help = require('./helper');
const answers = require('./respostas');

const preCadastroUrl = process.env.FORM_PRECADASTRO;

/*
    Mock das respostas que vem da planilha do google. Cada chave foi definida lá, o nome das perguntas vem do próprio formulário
    As respostas chegem através do /spread
*/
const bodyMock = {
	nome_sheet: 'Pré-Cadastro',
	timestamp: '2019-05-29T17:27:32.457Z',
	respostas:
    [{ pergunta: 'Nome', resposta: 'Jon Arbuckle' }, { pergunta: 'Empresa', resposta: 'Paws, Inc. ' }, { pergunta: 'Cargo', resposta: 'Cartoonist' }],
};

async function handleNewAnswer(body) {
	switch (body.nome_sheet) {
	case 'Pré-Cadastro':
		await answers.gerarNovaUrl(await answers.preparaRespostas(preCadastroUrl, answers.preCadastroMap, body.respostas), preCadastroUrl);
		break;
	default:
		console.log('Default em handleNewAnswer', JSON.stringify(body, null, 2)); help.Sentry.captureMessage('Default em handleNewAnswer');
		break;
	}
}

// handleNewAnswer(bodyMock);


module.exports = {
	handleNewAnswer,
};
