// const { turma } = require('../server/models');
// const help = require('./helper');
// const { updateNotificationTurma } = require('./admin_menu/admin_helper');

// // relation of keys from the spreadsheet and the model attributes
// const turmaMap = {
// 	turma: 'nome',
// 	statusDaTurma: 'status',
// 	local: 'local',
// 	pagseguroId: 'pagseguroID',
// 	datahora1: 'modulo1',
// 	datahora2: 'modulo2',
// 	datahora3: 'modulo3',
// 	inCompany: 'inCompany',
// 	whatsapp: 'whatsapp',
// 	disc: 'disc',
// };

// async function handleInCompany(queryInput, aux) {
// 	if (queryInput === 'inCompany') {
// 		if (aux.toLowerCase() === 'sim') {
// 			aux = true;
// 		} else if (['nao', 'não'].includes(aux.toLowerCase())) {
// 			aux = false;
// 		} else {
// 			aux = 'ignore_me';
// 		}
// 	}
// 	return aux;
// }

// // adapt the spreadsheet keys to match the model
// async function buildQuery(data, map) {
// 	const result = {};

// 	Object.keys(data).forEach(async (element) => {
// 		const queryInput = map[element];
// 		if (queryInput && queryInput.toString() && data[element] && data[element].toString()) {
// 			let aux = data[element].toString().trim();
// 			aux = await handleInCompany(queryInput, aux);
// 			result[queryInput] = aux;
// 		}
// 	});

// 	return result || false;
// }

// // check which spreadsheet values are different from the values we have saved, the ones that are different will be updated
// async function buildUpdateQuery(newData, oldData) {
// 	const result = {};

// 	Object.keys(newData).forEach((element) => {
// 		if (newData[element] !== 'ignore_me' && ((!oldData[element] && newData[element]) || newData[element].toString() !== oldData[element].toString())) {
// 			result[element] = newData[element];
// 		}
// 	});

// 	return result || false;
// }

// const offset = 6; // spreadsheet starts at line 6

// async function updateTurmas() {
// 	const results = [];
// 	const errors = [];
// 	const spreadsheet = await help.getFormatedSpreadsheet();
// 	if (spreadsheet && spreadsheet.length > 0) {
// 		for (let i = 0; i < spreadsheet.length; i++) {
// 			const e = spreadsheet[i];
// 			if (!e.datahora1 || !e.datahora2 || !e.datahora3) {
// 				errors.push({ line: i + 1 + offset, msg: 'datas não estão preenchidas corretamente!' });
// 			} else if (!e.turma) {
// 				errors.push({ line: i + 1 + offset, msg: 'falta preencher turma!' });
// 			} else {
// 				if (e.inCompany) {
// 					let inCompany = e.inCompany.toString(); inCompany = inCompany ? inCompany.trim() : '';
// 					if (!inCompany || !['sim', 'não', 'nao'].includes(inCompany.toLowerCase())) {
// 						errors.push({ line: i + 1 + offset, msg: 'Valores da coluna "In Company" só podem ser "Sim" ou "Não".' });
// 					}
// 				}
// 				const query = await buildQuery(e, turmaMap);
// 				if (query) {
// 					const found = await turma.findOrCreate({ where: { nome: query.nome }, defaults: query }).then(([data, created]) => {
// 						if (created) { return created; }
// 						return data.dataValues; // if a new turma wasn't created we might have to update it, so return it
// 					}).catch((err) => help.sentryError('turma findOrCreate', err));
// 					if (found.id) { // we might need to update it
// 						const updateQuery = await buildUpdateQuery(query, found);
// 						if (updateQuery) {
// 							const update = await turma.update(updateQuery, { where: { id: found.id } }).then((res) => res).catch((err) => help.sentryError('turma update', err));
// 							if (update) { results.push(`Linha ${i + 1 + offset} atualizada!`); }
// 							if (typeof updateQuery.inCompany === 'boolean') { // if this element exists, the type of turma has been updated and we need to update the notifications
// 								await updateNotificationTurma(found.id);
// 							}
// 						}
// 					} else if (found === true) { results.push(`Linha ${i + 1 + offset} adicionada!`); }
// 				} else { results.push(`Erro na linha ${i + 1 + offset}. Falta preencher algum dado.`); }
// 			}
// 		}
// 	}

// 	return { results, errors };
// }

module.exports = { updateTurmas: () => {} };
