require('dotenv').config();
// const help = require('./helper');

// separa a query string (parte com entry) e retorna um objeto
function QueryStringToJSON(url) {
	const pairs = url.split('&');

	const result = {};
	pairs.forEach((pair) => {
		let newPair = pair;
		if (newPair.slice(0, 5) === 'entry') { // filtra tudo que não é id das perguntas
			newPair = pair.split('=');
			result[newPair[0]] = decodeURIComponent(newPair[1] || '');
		}
	});

	return JSON.parse(JSON.stringify(result));
}

/*
    Mapa da relação entre o ID (entry) de um formulário com o nome da pergunta com resposta relacionada de um formulário anterior.
    Cada formulário precisa de um. O nomeNovo indicar qual é o nome da pergunta que será pre-preenchida no novo quiz. Não tem importância real, é só para melhor controle.
*/
const preCadastroMap = [
	{
		nomeAnterior: 'Nome',
		nomeNovo: 'Nome',
		entry: 'entry.1028816537',
	},
	{
		nomeAnterior: 'Cargo',
		nomeNovo: 'Cargo',
		entry: 'entry.201149199',
	},
];

/*
		url: url original do form, deve ser gerado através do get pre-filled form e salvo em uma env
		mapa: a relação entre o id da nova pergunta e o nome da pergunta equivalente no ormulário anterior
		respostas: as respostas do formulário antigo, vem do body do post /spread
		Retorna objeto com os novos entrys e as velhas respostas. { 'entry.1029123456': 'minha resposta' }
*/
async function preparaRespostas(url, mapa, respostas) {
	const respostasNovas = QueryStringToJSON(url); // pego o objeto com as perguntas vindo da url
	console.log('perguntasold', respostasNovas);

	Object.keys(respostasNovas).forEach((key) => {
		const perguntaAux = mapa.find(x => x.entry === key); // encontro o mesmo id no mapa
		if (!perguntaAux || !perguntaAux.entry || !perguntaAux.nomeAnterior) { // se não existir removo essa chave
			delete respostasNovas[key];
		} else {
			const respostaAux = respostas.find(x => x.pergunta === perguntaAux.nomeAnterior); // encontro a resposta através do nome
			if (!respostaAux || !respostaAux.pergunta || !respostaAux.resposta) { // se não existir removo essa chave
				delete respostasNovas[key];
			} else { // salvo nas respostas novas a resposta equivalente do formulário anterior (novo entry.id <-> velha resposta)
				respostasNovas[key] = respostaAux.resposta;
			}
		}
	});

	console.log('perguntasnew', respostasNovas);

	return respostasNovas;
}

/*
		respostas: resultado do preparaRespostas
		url: url original do form, deve ser gerado através do get pre-filled form e salvo em uma env
    Corta link original do form (com entry) e remonta query string usando as respostas, retornando a url com as respostas personalizadas
*/
async function gerarNovaUrl(respostas, url) {
	let newUrl = url;
	const result = url.match(/entry/i); // pega index de onde começa o entry na query string
	newUrl = newUrl.replace(newUrl.slice(result.index, newUrl.length), ''); // apaga a query string da url (só a parte com entry)

	Object.keys(respostas).forEach((key) => { // remonta a query string usando as respostas que temos
		if (respostas[key] && respostas[key].length > 0) { // se existir, adiciona entry.1028816537=resposta&
			newUrl += `${key}=${respostas[key]}&`;
		}
	});
	newUrl = newUrl.slice(0, -1); // remove último caractere (&)
	newUrl = newUrl.replace(/#+/g, ''); // remove # da url
	newUrl = encodeURI(newUrl); // encoda como url

	console.log('newUrl', newUrl);

	return newUrl;
}


module.exports = {
	preCadastroMap, gerarNovaUrl, preparaRespostas,
};

/*
	O que queremos fazer:
		Quando o usuário responde um formulário ele é salvo na planilha. A planilha, ao receber nova linha de respostas manda um post com as respostas para o endpoint /spread.
		Usaremos essas respostas para personalizar (pré-preencher) algumas das respostas do novo formulário.

  Como funciona:
    Preparando a url:
      Crie um novo Google Form
      Clique nos três pontinhos e escolha Get pre-filled link
			Responda as perguntas que deseja que tenham as respostas dinâmicas com qualquer resposta.
			Ou responda todas as perguntas mas é necessário que saibamos quais os ids das perguntas que queremos que sejam personalizadas.
      Gere e copie o link (Get Link e Copy Link)
      Ele fica assim: 'https://docs.google.com/forms/d/e/<id_do_form>/viewform?usp=pp_url&entry.1028819500=RESPOSTA1&entry.449366458=RESPOSTA2&entry.239247531=Feminino'
        viewform?usp=pp_url => significa que é pre-filled url
        entry.1028819500 => id da pergunta
        RESPOSTA1 => a resposta de texto que vamos substituir
        entry.239247531=Feminino => Questão de múltipla escolha tem outro tratamento baseado no id
      Essa url deve ser copiada para um env. Exemplo: FORM_PRECADASTRO

    Personalizando as respostas:
      Para personalizar as respostas em um link, é necessário preparar as respostas do formulário anterior.
      Para fazer isso vamos ter que criar um objeto das respostas que queremos para que possamos substituir nos novos entry.
			Exemplo: preparaRespostas(preCadastroUrl, preCadastroMap, body.respostas)

		Crar o novo link:
			O link antigo é separado das respostas de template e usamos o novo objeto de respostas para criar a nova query string.
			gerarNovaUrl(await preparaRespostas(preCadastroUrl, preCadastroMap, body.respostas), preCadastroUrl);
*/
