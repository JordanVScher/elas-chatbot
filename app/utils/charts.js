const { promisify } = require('util');
const { readFileSync } = require('fs');
const chart = require('../simple_chart');
const chartsMaps = require('./charts_maps');
const help = require('./helper');
const db = require('./DB_helper');


async function buildAlunoChart(cpf) {
	const aluna = await db.getAlunoRespostas(cpf);
	const data = {};

	if (aluna && aluna.pre && aluna.pos) {
		chartsMaps.sondagem.forEach(async (element) => { // this map contains only the necessary answers
			if (aluna.pre[element.paramName] && aluna.pos[element.paramName]) { // build obj with param_name and the number variation
				data[element.questionName] = help.getPercentageChange(aluna.pre[element.paramName], aluna.pos[element.paramName]);
			}
		});
	}

	if (data && Object.keys(data) && Object.keys(data).length > 0) {
		const result = await chart.createChart(Object.keys(data), Object.values(data), cpf, `Resultado auto-avaliação ${aluna.nome}`);
		return result;
	}

	return false;
}

async function separateIndicadosData(cpf) {
	const indicado = await db.getIndicadoRespostas(cpf);

	let newMap = chartsMaps.avaliacao360Pre;
	const commomKeys = ['avalias', 'exemplo', 'melhora'];
	const size = newMap.length / commomKeys.length;
	const data = []; // contains only the answers from pre

	for (let i = 1; i <= size; i++) {
		const aux = {};
		aux.titlePre = newMap.find((x) => x.paramName === `${commomKeys[0]}${i}`); aux.titlePre = `Q${i}. ${aux.titlePre.questionName}`;
		commomKeys.forEach((element) => {
			aux[`${element}Pre`] = indicado.reduce((prev, cur) => `${prev} ${cur.pre && cur.pre[`${element}${i}`] ? `--${cur.pre[`${element}${i}`]}` : ''}`, '');
		});
		data.push(aux);
	}

	const result = []; // mixes pre and pos
	newMap = chartsMaps.avaliador360pos;
	commomKeys.pop(); // pos doesnt have "melhora"
	const posKeys = ['houve_evolucao', 'onde_evolucao'];

	for (let i = 1; i <= size; i++) {
		const aux = data[i - 1]; // getting aux from the previous array
		aux.titlePos = newMap.find((x) => x.paramName === `${commomKeys[0]}${i}`); aux.titlePos = `Q${i}. ${aux.titlePos.questionName}`;
    commomKeys.forEach((element) => { // eslint-disable-line
			aux[`${element}Pos`] = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[`${element}${i}`] ? `--${cur.pos[`${element}${i}`]}` : ''}`, '');
		});
    commomKeys.forEach((element) => { // eslint-disable-line
			aux.houveEvolucao = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[posKeys[0]] ? `--${cur.pos[posKeys[0]]}` : ''}`, '');
			aux.ondeEvolucao = indicado.reduce((prev, cur) => `${prev} ${cur.pos && cur.pos[posKeys[1]] ? `--${cur.pos[posKeys[1]]}` : ''}`, '');
		});

		result.push(aux);
	}

	return result;
}

// check if the generated pdf wont be created empty
async function checkIfDataExists(data) {
	let check = false;

	for (let i = 0; i < data.length; i++) {
		const element = data[i];

		if (element.avaliasPre || element.exemploPre || element.melhoraPre || element.avaliasPos || data[0].houveEvolucao || data[0].ondeEvolucao) {
			check = true; i = data.length;
		}
	}

	return check;
}

async function buildIndicadoChart(cpf) {
	const data = await separateIndicadosData(cpf);

	if (await checkIfDataExists(data) === true) {
		const styleDiv = 'font-size:10pt;margin-left:1.5em;margin-right:1.5em;margin-bottom:0.5em;margin-top:2.0em';
		let html = `<p style="${styleDiv}"><h1>Resultados</h1></p>`;
		html += `<table style="width:100% border:1px solid black " border=1>
		<tr> <th>Questão Pré</th> <th>Avaliação Pré</th> <th>Exemplo Pré</th> <th>Oportunidade Pré</th> `;
		data.forEach((element) => {
			html += `<tr> <td>${element.titlePre}</td> 
			<td>${element.avaliasPre}</td> <td>${element.exemploPre}</td> <td>${element.melhoraPre}</td> </tr>`;
		});
		html += '</table><br><br>';
		html += `<table style="width:100% border:1px solid black" border=1>
		<tr> <th>Questão Pós</th> <th>Avaliação Pós</th>`;
		data.forEach((element) => {
			html += `<tr> <td>${element.titlePos}</td> <td>${element.avaliasPos}</td> </tr>`;
		});
		html += '</table>';

		html += `<p style="${styleDiv}"><h5>Houve evolução?</h5></p> <div> ${data[0].houveEvolucao} </div>`;
		html += `<p style="${styleDiv}"><h5>Onde houve evolução?</h5></p> <div> ${data[0].ondeEvolucao} </div>`;


		const createPDFAsync = promisify(help.pdf.create);
		const result = await createPDFAsync(html).then((tmp) => tmp).catch((err) => console.log(err));

		return result;
	}
	return [];
}
// async function gambiarra(char, value = 0.57) {
// 	return char * value;
// }
async function formatSondagemPDF(buffer, name) {
	const img = buffer.toString('base64');

	const config = {
		base: `file://${process.cwd()}/mail_template/`,
		// header: {
		// 	height: '10mm',
		// 	contents: {
		// 		// first: '',
		// 		2: 'Second page', // Any page number is working. 1-based index
		// 		default: '', // fallback value
		// 		// last: 'Last Page',
		// 	},
		// },
		// type: 'png', // allowed file types: png, jpeg, pdf
		// quality: '100',
		// border: {
		// top: '10px', // default is 0, units: mm, cm, in, px
		// 	right: '20px',
		// bottom: '20px',
		// 	left: '20px',
		// },
	};

	let html = await readFileSync(`${process.cwd()}/mail_template/chart.html`, 'utf-8');
	html = html.replace('{{name}}', name);
	html = html.replace('{{img}}', img);
	const size = 50 - ((name.length - 1) * 0.95);
	html = html.replace('{{size}}', size);

	const createPDFAsync = promisify(help.pdf.create);
	const result = await createPDFAsync(html, config).then((tmp) => tmp).catch((err) => console.log(err));

	return result.filename;
}

module.exports = {
	buildAlunoChart, separateIndicadosData, buildIndicadoChart, formatSondagemPDF,
};
