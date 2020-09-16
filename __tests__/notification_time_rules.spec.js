const { checkShouldSendNotification } = require('../app/utils/notificationSendQueue');
const data = require('./mock_data');

const { notificationRules } = data;
const { turma } = data;

describe('Notification before modulo, no hour. Min before mod1, max is mod1', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));

	it('Dont send if notification is not active', async () => {
		const today = new Date('2019-12-30T17:29:59.999Z');
		const rules = [{
			is_active: false,
			notification_type: 1,
			modulo: 1,
			timeChange: [{ days: 4 }],
		}];


		const result = await checkShouldSendNotification(notification, turma, rules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.notActive).toBeTruthy();
	});

	it('Dont send if notification doesnt have data rules', async () => {
		const today = new Date('2019-12-30T17:29:59.999Z');
		const rules = [{
			is_active: true,
			notification_type: 1,
			modulo: 1,
			timeChange: [],
		}];


		const result = await checkShouldSendNotification(notification, turma, rules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.noTimeSet).toBeTruthy();
	});

	it('Dont send before min date', async () => {
		const today = new Date('2019-12-30T17:29:59.999Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
	});

	it('Send on min date', async () => {
		const today = new Date('2019-12-30T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
	});

	it('Send between min and max date', async () => {
		const today = new Date('2020-01-10T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
	});

	it('Send on max date', async () => {
		const today = new Date('2020-01-10T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
	});

	it('Dont send after max date', async () => {
		const today = new Date('2020-01-11T17:30:00.001Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
	});
});

describe('Notification after modulo, no hour. Min after mod1, max is mod2', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 4;

	it('Dont send before min date', async () => {
		const today = new Date('2020-01-15T17:29:59.999Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
	});

	it('Send on min date', async () => {
		const today = new Date('2020-01-15T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
	});

	it('Send between min and max date', async () => {
		const today = new Date('2020-01-17T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
	});

	it('Send on max date', async () => {
		const today = new Date('2020-02-10T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
	});

	it('Dont send after max date', async () => {
		const today = new Date('2020-02-10T17:30:00.001Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
	});

	it('Send even if Date is after the next module (making next modulo date the min date instead of the max date)', async () => {
		notification.notification_type = 25;
		const today = new Date('2020-02-25T17:30:00.000Z');

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max > turma.modulo2).toBeTruthy();
	});
});


describe('Notification on last module', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));

	describe('Add 15 days if max date is after modulo date', () => {
		it('Send', async () => {
			notification.notification_type = 13;
			const today = new Date('2020-03-15T17:30:00.001Z');

			const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
			await expect(result && !result.error).toBeTruthy();
			await expect(result.sendNow).toBeTruthy();
			await expect(result.min > turma.modulo3).toBeTruthy();
			const afterAdding = result.max; afterAdding.setDate(afterAdding.getDate() + 15);
			await expect(result.max === afterAdding).toBeTruthy();
		});

		it('Dont send', async () => {
			notification.notification_type = 13;
			const today = new Date('2020-03-26T17:30:00.001Z');

			const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
			await expect(result && !result.error).toBeTruthy();
			await expect(result.sendNow).toBeFalsy();
			await expect(result.min > turma.modulo3).toBeTruthy();
			const afterAdding = result.max; afterAdding.setDate(afterAdding.getDate() + 15);
			await expect(result.max === afterAdding).toBeTruthy();
		});
	});

	describe('Dont add 15 days if max date is before modulo date', () => {
		it('Send', async () => {
			notification.notification_type = 11;
			const today = new Date('2020-03-05T17:30:00.001Z');

			const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
			await expect(result && !result.error).toBeTruthy();
			await expect(result.sendNow).toBeTruthy();
			await expect(result.min < turma.modulo3).toBeTruthy();
			await expect(result.max.toString() === turma.modulo3.toString()).toBeTruthy();
		});

		it('Dont', async () => {
			notification.notification_type = 11;
			const today = new Date('2020-03-26T17:30:00.001Z');

			const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
			await expect(result && !result.error).toBeTruthy();
			await expect(result.sendNow).toBeFalsy();
			await expect(result.min < turma.modulo3).toBeTruthy();
			await expect(result.max.toString() === turma.modulo3.toString()).toBeTruthy();
		});
	});
});

describe('Add reminder date (Lembrete de reenvio).', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));

	it('Use absolute value of Reminder Date', async () => {
		const today = new Date('2020-05-10T17:30:00.001Z');

		notification.notification_type = 23;
		notification.check_answered = false;
		const resultSemCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		notification.check_answered = true;
		const resultComCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		await expect(resultSemCheck.min < resultComCheck.min).toBeTruthy();
	});

	it('Dont send Reenvio with Reminder Date', async () => {
		const today = new Date('2020-01-02T17:30:00.001Z');

		notification.notification_type = 3;
		notification.check_answered = false;
		const resultSemCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		notification.check_answered = true;
		const resultComCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		await expect(resultComCheck && !resultComCheck.error).toBeTruthy();
		await expect(resultComCheck.sendNow).toBeFalsy();
		await expect(resultComCheck.min < turma.modulo1).toBeTruthy();
		await expect(resultComCheck.max.toString() === turma.modulo1.toString()).toBeTruthy();

		await expect(resultSemCheck.min < resultComCheck.min).toBeTruthy();
	});

	it('Send Reenvio with Reminder Date', async () => {
		const today = new Date('2020-01-09T17:30:00.001Z');

		notification.notification_type = 3;
		notification.check_answered = false;
		const resultSemCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		notification.check_answered = true;
		const resultComCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		await expect(resultComCheck && !resultComCheck.error).toBeTruthy();
		await expect(resultComCheck.sendNow).toBeTruthy();
		await expect(resultComCheck.min < turma.modulo1).toBeTruthy();
		await expect(resultComCheck.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(resultSemCheck.min < resultComCheck.min).toBeTruthy();
	});

	it('Send - Reminder Date can be after modulo date', async () => {
		const today = new Date('2020-02-15T17:30:00.000Z');

		notification.notification_type = 24;
		notification.check_answered = false;
		const resultSemCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		notification.check_answered = true;
		const resultComCheck = await checkShouldSendNotification(notification, turma, notificationRules, today);

		await expect(resultComCheck && !resultComCheck.error).toBeTruthy();
		await expect(resultComCheck.sendNow).toBeTruthy();
		await expect(resultComCheck.min < resultComCheck.max).toBeTruthy();
		await expect(resultComCheck.min > turma.modulo1).toBeTruthy();
		await expect(resultSemCheck.min < resultComCheck.min).toBeTruthy();
	});
});

describe('Additional Details - Um dia antes', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 14;

	it('14 - Detalhe do módulo 1', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Não envia antes de um dia', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() - 1);
		today.setHours(today.getHours() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min > today).toBeTruthy();
	});

	it('14 - Não envia depois do módulo', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setHours(today.getHours() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.max < today).toBeTruthy();
	});

	it('14 - Detalhe do módulo 2', async () => {
		notification.additional_details = { modulo: 2 };

		const today = new Date(turma.modulo2);
		today.setDate(today.getDate() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo2).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Detalhe do módulo 3', async () => {
		notification.additional_details = { modulo: 3 };

		const today = new Date(turma.modulo3);
		today.setDate(today.getDate() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo3).toBeTruthy();
		await expect(result.max.toString() === turma.modulo3.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Erro se não existir a regra específica do módulo', async () => {
		notification.additional_details = { modulo: 4 };
		const today = new Date();

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeFalsy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.error.params.type).toBe(notification.notification_type);
		await expect(result.error.params.currentRule).toBeFalsy();
	});
});

describe('Additional Details - Uma hora antes', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 15;

	it('15 - Módulo 1, não é domingo', async () => {
		notification.additional_details = { modulo: 1, sunday: false };
		const today = new Date(turma.modulo1);
		today.setHours(today.getHours() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 - Módulo 1, não é domingo, não envia antes da regra', async () => {
		notification.additional_details = { modulo: 1, sunday: false };
		const today = new Date(turma.modulo1);
		today.setHours(today.getHours() - 1);
		today.setMinutes(today.getMinutes() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min > today).toBeTruthy();
	});

	it('15 - Módulo 1, não é domingo, não envia depois do módulo', async () => {
		notification.additional_details = { modulo: 1, sunday: false };
		const today = new Date(turma.modulo1);
		today.setMinutes(today.getMinutes() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.max < today).toBeTruthy();
	});

	it('15 - Módulo 1, é domingo', async () => {
		notification.additional_details = { modulo: 1, sunday: true };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() + 1);
		today.setHours(today.getHours() - 1);
		const max = new Date(turma.modulo1);
		max.setDate(max.getDate() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.max > turma.modulo1).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === max.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 - Módulo 1, é domingo, não envia antes da regra', async () => {
		notification.additional_details = { modulo: 1, sunday: true };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() + 1);
		today.setHours(today.getHours() - 1);
		today.setMinutes(today.getMinutes() - 5);
		const max = new Date(turma.modulo1);
		max.setDate(max.getDate() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.max > turma.modulo1).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === max.toString()).toBeTruthy();
		await expect(result.min > today).toBeTruthy();
	});

	it('15 - Módulo 1, é domingo, não envia depois de um dia do módulo', async () => {
		notification.additional_details = { modulo: 1, sunday: true };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() + 1);
		today.setMinutes(today.getMinutes() + 5);
		const max = new Date(turma.modulo1);
		max.setDate(max.getDate() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.max > turma.modulo1).toBeTruthy();
		await expect(result.min > turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === max.toString()).toBeTruthy();
		await expect(result.max < today).toBeTruthy();
	});

	it('15 - Módulo 2, não é domingo', async () => {
		notification.additional_details = { modulo: 2, sunday: false };
		const today = new Date(turma.modulo2);
		today.setHours(today.getHours() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo2).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 - Módulo 2, é domingo', async () => {
		notification.additional_details = { modulo: 2, sunday: true };

		const today = new Date(turma.modulo2);
		today.setDate(today.getDate() + 1);
		today.setHours(today.getHours() - 1);
		const max = new Date(turma.modulo2);
		max.setDate(max.getDate() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.max > turma.modulo2).toBeTruthy();
		await expect(result.min > turma.modulo2).toBeTruthy();
		await expect(result.max.toString() === max.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 - Módulo 3, não é domingo', async () => {
		notification.additional_details = { modulo: 3, sunday: false };
		const today = new Date(turma.modulo3);
		today.setHours(today.getHours() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo3).toBeTruthy();
		await expect(result.max.toString() === turma.modulo3.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 - Módulo 3, é domingo', async () => {
		notification.additional_details = { modulo: 3, sunday: true };

		const today = new Date(turma.modulo3);
		today.setDate(today.getDate() + 1);
		today.setHours(today.getHours() - 1);
		const max = new Date(turma.modulo3);
		max.setDate(max.getDate() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.max > turma.modulo3).toBeTruthy();
		await expect(result.min > turma.modulo3).toBeTruthy();
		await expect(result.max.toString() === max.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('15 -  se não existir a regra específica do módulo', async () => {
		notification.notification_type = 15;
		notification.additional_details = { modulo: 4 };
		const today = new Date();

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeFalsy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.error.params.type).toBe(notification.notification_type);
		await expect(result.error.params.currentRule).toBeFalsy();
	});

	it('15 -  valor inválido pra sunday', async () => {
		notification.notification_type = 15;
		notification.additional_details = { modulo: 3, sunday: 'foobar' };
		const today = new Date();

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeFalsy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.error.params.type).toBe(notification.notification_type);
		await expect(result.error.params.currentRule).toBeFalsy();
	});
});

describe('Additional Details - dois dias antes', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));
	notification.notification_type = 16;

	it('14 - Detalhe do módulo 1', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() - 2);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Não envia antes de dois dias', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setDate(today.getDate() - 2);
		today.setHours(today.getHours() - 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.min > today).toBeTruthy();
	});

	it('14 - Não envia depois do módulo', async () => {
		notification.additional_details = { modulo: 1 };

		const today = new Date(turma.modulo1);
		today.setHours(today.getHours() + 1);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.min < turma.modulo1).toBeTruthy();
		await expect(result.max.toString() === turma.modulo1.toString()).toBeTruthy();
		await expect(result.max < today).toBeTruthy();
	});

	it('14 - Detalhe do módulo 2', async () => {
		notification.additional_details = { modulo: 2 };

		const today = new Date(turma.modulo2);
		today.setDate(today.getDate() - 2);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo2).toBeTruthy();
		await expect(result.max.toString() === turma.modulo2.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Detalhe do módulo 3', async () => {
		notification.additional_details = { modulo: 3 };

		const today = new Date(turma.modulo3);
		today.setDate(today.getDate() - 2);

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeTruthy();
		await expect(result.sendNow).toBeTruthy();
		await expect(result.min < turma.modulo3).toBeTruthy();
		await expect(result.max.toString() === turma.modulo3.toString()).toBeTruthy();
		await expect(result.min.toString() === today.toString()).toBeTruthy();
	});

	it('14 - Erro se não existir a regra específica do módulo', async () => {
		notification.additional_details = { modulo: 4 };
		const today = new Date();

		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && !result.error).toBeFalsy();
		await expect(result.sendNow).toBeFalsy();
		await expect(result.error.params.type).toBe(notification.notification_type);
		await expect(result.error.params.currentRule).toBeFalsy();
	});
});

describe('Error', () => {
	const notification = JSON.parse(JSON.stringify(data.notification));
	it('Erro - Cant find currentRule', async () => {
		const type = 2666;
		notification.notification_type = type;
		const today = new Date();
		const result = await checkShouldSendNotification(notification, turma, notificationRules, today);
		await expect(result && result.error && result.error.params).toBeTruthy();
		await expect(result.error.params.type).toBe(type);
		await expect(result.error.params.currentRule).toBeFalsy();
	});
});

// const { sequelize } = require('../app/server/models/index');
// afterAll(() => { sequelize.close(); });
