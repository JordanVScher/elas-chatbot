async function removeUndefined(array) {
	const results = array;
	results.forEach((obj) => {
		Object.keys(obj).forEach((key) => {
			if (obj[key] === 'undefined' || obj[key] === null) obj[key] = '';
		});
	});

	return results;
}

async function formatBoolean(array) {
	const results = array;
	results.forEach((obj) => {
		Object.keys(obj).forEach((key) => {
			if (typeof obj[key] === 'boolean') {
				if (obj[key]) {
					obj[key] = 'Sim';
				} else {
					obj[key] = 'Não';
				}
			}
		});
	});

	return results;
}

function swap(json) {
	const ret = {};
	for (const key in json) { // eslint-disable-line
		ret[json[key]] = key;
	}
	return ret;
}

const alunaCSV = {
	id: 'ID',
	cpf: 'CPF',
	// turma: 'Turma',
	email: 'E-mail',
	nome_completo: 'Nome Completo',
	telefone: 'Telefone',
	rg: 'RG',
	endereco: 'Endereço',
	data_nascimento: 'Data de Nascimento',
	contato_emergencia_nome: 'Nome Contado de Emergência',
	contato_emergencia_email: 'E-mail do Contado',
	contato_emergencia_fone: 'Telefone do Contado',
	contato_emergencia_relacao: 'Relação com Contado',

};

async function convertCSVToDB(line, dictionary) {
	Object.keys(dictionary).forEach((element) => {
		dictionary[element.replace(/\s/g, '')] = dictionary[element];
	});

	Object.keys(line).forEach((element) => {
		const key = element.replace(/\s/g, '');

		if (dictionary[key]) {
			line[dictionary[key]] = line[element];
			delete line[element];
		}
	});

	return line;
}

module.exports = 	{
	removeUndefined,
	formatBoolean,
	convertCSVToDB,
	alunaCSV,
	swap,
};
