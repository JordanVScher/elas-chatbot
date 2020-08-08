const { checkShouldSendRecipient } = require('../app/utils/notificationSendQueue');
const data = require('./mock_data');

const { turma } = data;

describe('Notification mail3', () => {
	const { indicado } = JSON.parse(JSON.stringify(data));
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 3;

	it('Reenvio, indicado answered pré, dont send', async () => {
		notification.check_answered = true;
		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeFalsy();
	});

	it('Reenvio, indicado dindt answer pré, send', async () => {
		notification.check_answered = true;
		indicado['respostas.pre'] = null;
		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeTruthy();
	});

	it('Not Reenvio, send', async () => {
		notification.check_answered = false;
		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeTruthy();
	});
});

describe('Notification mail9', () => {
	const { indicado } = JSON.parse(JSON.stringify(data));
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 9;

	it('Reenvio, indicado answered pré and pós, dont send', async () => {
		notification.check_answered = true;
		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeFalsy();
	});

	it('Reenvio, indicado answered pré but not pós, send', async () => {
		notification.check_answered = true;
		indicado['respostas.pos'] = null;

		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeTruthy();
	});

	it('Not Reenvio, indicado answered pré, send', async () => {
		notification.check_answered = false;
		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeTruthy();
	});

	it('Not Reenvio, indicado didnt answer pré, dont send', async () => {
		notification.check_answered = false;
		indicado['respostas.pre'] = null;

		const res = await checkShouldSendRecipient(indicado, notification, turma, new Date());
		await expect(res).toBeTruthy();
		await expect(res.send).toBeFalsy();
	});
});
