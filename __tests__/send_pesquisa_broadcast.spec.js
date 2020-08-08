require('dotenv').config();

const sendPesquisa = require('../app/utils/pesquisa/send_pesquisa_broadcast');
const data = require('./mock_data');

it('checkSendPesquisa - dont send before initial date', async () => {
	const aluno = data.pesquisaAluno; aluno.msgsEnviadas = 0;
	const today = new Date('2018-10-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - dont send on initial date', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2019-01-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - dont send after initial date and before 1st broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2019-07-09T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - send on the day of the 1st broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2019-07-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - send after 1st broadcast day', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2019-07-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - dont send before 2nd broadcast', async () => {
	const aluno = data.pesquisaAluno; aluno.msgsEnviadas = 1;
	const today = new Date('2019-07-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - send on 2nd broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2020-01-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - send after on 2nd broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2020-03-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - dont send before 3rd broadcast', async () => {
	const aluno = data.pesquisaAluno; aluno.msgsEnviadas = 2;
	const today = new Date('2020-06-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - send on 3rd broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2020-07-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - send after on 3rd broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2020-08-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - dont send before 4th broadcast', async () => {
	const aluno = data.pesquisaAluno; aluno.msgsEnviadas = 3;
	const today = new Date('2020-12-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});

it('checkSendPesquisa - send on 4th broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2021-01-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - send after on 4th broadcast', async () => {
	const aluno = data.pesquisaAluno;
	const today = new Date('2021-02-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeTruthy();
});

it('checkSendPesquisa - dont send if all the links are complete', async () => {
	const aluno = data.pesquisaAluno; aluno.msgsEnviadas = 4;
	aluno.linksEnviados = {
		1: 'foobar1', 2: 'foobar2', 3: 'foobar3', 4: 'foobar4',
	};
	const today = new Date('2021-02-10T10:00:00.000Z');
	const result = await sendPesquisa.checkSendPesquisa(today, aluno);
	await expect(result).toBeFalsy();
});
