const { promisify } = require('util');
const fs = require('fs');
const chart = require('../simple_chart');
const chartsMaps = require('./charts_maps');
const help = require('./helper');
const db = require('./DB_helper');

// async function buildAlunoChartOld(cpf) {
// 	const aluna = await db.getAlunoRespostas(cpf);
// 	const result = [];

// 	const secondHalf = [...chartsMaps.sondagem];
// 	const firstHalf = secondHalf.splice(0, 23);
// 	const charts = [firstHalf, secondHalf];

// 	if (aluna && aluna.pre && aluna.pos) {
// 		for (let i = 0; i < charts.length; i++) {
// 			const e = charts[i];

// 			const data = {};
// 			e.forEach(async (element) => { // this map contains only the necessary answers
// 				if (aluna.pre[element.paramName] && aluna.pos[element.paramName]) { // build obj with param_name and the number variation
// 					data[element.questionName] = help.getPercentageChange(aluna.pre[element.paramName], aluna.pos[element.paramName]);
// 				}
// 			});

// 			if (data && Object.keys(data) && Object.keys(data).length > 0) {
// 				const res = await chart.createChart(Object.keys(data), Object.values(data), cpf, `Resultado auto-avaliação ${aluna.nome}`);
// 				result.push(res);
// 			}
// 		}
// 		return result;
// 	}

// 	return false;
// }

async function buildTurmaChart(turmaID) {
	const allAnswers = await db.getTurmaRespostas(turmaID);
	const respostas = { pre: {}, pos: {} };
	const result = [];

	if (!allAnswers || allAnswers.length === 0) return false;

	allAnswers.forEach((answer) => { // sum all of the values in the answers
		Object.keys(answer.pre).forEach((e) => {
			if (!respostas.pre[e]) respostas.pre[e] = 0;
			respostas.pre[e] += parseInt(answer.pre[e], 10);
		});
		Object.keys(answer.pos).forEach((e) => {
			if (!respostas.pos[e]) respostas.pos[e] = 0;
			respostas.pos[e] += parseInt(answer.pos[e], 10);
		});
	});

	delete respostas.pre.cpf;
	delete respostas.pos.cpf;
	// get the average
	const divideBy = allAnswers.length;
	Object.keys(respostas.pre).forEach((e) => { respostas.pre[e] /= divideBy; });
	Object.keys(respostas.pos).forEach((e) => { respostas.pos[e] /= divideBy; });


	const secondHalf = [...chartsMaps.sondagem];
	const firstHalf = secondHalf.splice(0, 23);
	const charts = [firstHalf, secondHalf];

	if (respostas && respostas.pre && respostas.pos) {
		for (let i = 0; i < charts.length; i++) {
			const e = charts[i];

			const data = {};
			e.forEach(async (element) => { // this map contains only the necessary answers
				if (respostas.pre[element.paramName] && respostas.pos[element.paramName]) { // build obj with param_name and the number variation
					data[element.questionName] = help.getPercentageChange(respostas.pre[element.paramName], respostas.pos[element.paramName]);
				}
			});

			if (data && Object.keys(data) && Object.keys(data).length > 0) {
				const res = await chart.createChart(Object.keys(data), Object.values(data), turmaID, `Resultado auto-avaliação da Turma ${await db.getTurmaName(turmaID)}`);
				result.push(res);
			}
		}
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

	if (data && await checkIfDataExists(data) === true) {
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

		if (!result || !result.filename) { return { error: 'Não foi possível gerar o resultado da avaliação 360 da aluna' }; }

		return result;
	}
	return { error: 'Não foi possível recuperar as respostas para a avaliação 360 da aluna' };
}

async function formatSondagemPDF(buffer, name) {
	const img = [];
	for (let i = 0; i < buffer.length; i++) {
		img.push(buffer[i].toString('base64'));
	}

	const config = {
		base: `file://${process.cwd()}/mail_template/`,
	};

	let html = await fs.readFileSync(`${process.cwd()}/mail_template/chart.html`, 'utf-8');
	html = html.replace('{{name}}', name);
	html = html.replace('{{img0}}', img[0]);
	html = html.replace('{{img1}}', img[1]);
	const size = 50 - ((name.length - 1) * 0.95);
	html = html.replace('{{size}}', size);

	const createPDFAsync = promisify(help.pdf.create);
	const result = await createPDFAsync(html, config).then((tmp) => tmp).catch((err) => console.log(err));

	return result.filename;
}

/**
 * builds a pdf doc with the answers and grade variation of the sondagem questionnaires
 * @param {integer} cpf - aluno cpf
 * @return {object} obj with the temporary path of the pdf file. Ex: { filename: '/tmp/html-pdf-3098.pdf' }
 */
async function buildAlunoChart(cpf) {
	const respostas = await db.getAlunoRespostas(cpf);

	// check if user has every answer needed
	if (!respostas) { return { error: 'Não foi possível recuperar as respostas da Sondagem' }; }
	if (!respostas.pre) { return { error: 'Não respondeu a Sondagem Pré' }; }
	if (!respostas.pos) { return { error: 'Não respondeu a Sondagem Pós' }; }

	// divide the answers table into two to fit the page
	const secondHalf = [...chartsMaps.sondagem];
	const firstHalf = secondHalf.splice(0, 19);
	const charts = [firstHalf, secondHalf];

	// header
	const styleDiv = 'font-size:10pt;margin-left:1.5em;margin-right:1.5em;margin-bottom:0.5em;margin-top:2.0em';
	let html = `<p style="${styleDiv}"><h3>Resultados Sondagem</h3></p>`;
	html += `<p>${await db.getTurmaName(respostas.turma_id)}<br>${respostas.nome}<br>${cpf}<br>${respostas.email}</p>`;

	// tables
	let questionNumber = 1;
	charts.forEach((map, i) => {
		html += `<table style="width:100% border:1px solid black" border=1>
			<tr> <th>Número</th> <th>Questão</th> <th>Nota Pré</th> <th>Nota Pós</th> <th>Variação</th> `;

		map.forEach((e) => {
			const key = e.paramName;
			const pre = respostas.pre[key] ? respostas.pre[key] : '';
			const pos = respostas.pos[key] ? respostas.pos[key] : '';
			let change = parseInt(pre, 10) && parseInt(pos, 10) ? help.getPercentageChange(pre, pos) : '';
			change = change ? `${change} %` : '';
			html += `<tr> <td>${questionNumber}</td> <td>${e.questionName}</td> <td>${pre}</td> <td>${pos}</td> <td>${change}</td> </tr>`;
			questionNumber += 1;
		});

		if (i + 1 < charts.length) { html += '</table><br><br><br><br>'; } // dont empty space on last table
	});

	const createPDFAsync = promisify(help.pdf.create);
	const result = await createPDFAsync(html).then((tmp) => tmp).catch((err) => console.log(err));

	if (!result || !result.filename) { return { error: 'Não existe respostas para gerar o resultado da sondagem da aluna' }; }
	return result;
}

async function buildAlunosDocs(turmaID) {
	const alunos = await db.getAlunasFromTurma(turmaID);
	const result = [];

	for (let i = 0; i < alunos.length; i++) {
		const aluno = alunos[i];
		if (aluno && aluno.cpf) {
			const aux = await buildAlunoChart(aluno.cpf);
			if (aux && aux.filename) {
				result.push({ aluno: aluno.nome_completo, sondagem: aux.filename });
			} else if (aux && aux.error) {
				result.push({ aluno: aluno.nome_completo, error: aux.error });
			} else {
				result.push({ aluno: aluno.nome_completo, error: 'Erro inesperado na sondagem' });
			}

			const aux2 = await buildIndicadoChart(aluno.cpf);
			if (aux2 && aux2.filename) {
				result.push({ aluno: aluno.nome_completo, avaliacao360: aux2.filename });
			} else if (aux2 && aux2.error) {
				result.push({ aluno: aluno.nome_completo, error: aux2.error });
			} else {
				result.push({ aluno: aluno.nome_completo, error: 'Erro inesperado na avaliação 360' });
			}
		}
	}

	return result;
}


module.exports = {
	buildAlunoChart, buildTurmaChart, separateIndicadosData, buildIndicadoChart, formatSondagemPDF, buildAlunosDocs,
};
