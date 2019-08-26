const { sequelize } = require('../app/server/models/index');

const sendNotificationQueue = require('../app/utils/notificationSendQueue');
const data = require('./mock_data');

process.env.NODE_ENV = 'prod';

it('checkShouldSendRecipient - no recipient', async () => {
	const notification = data.indicadoNotification; const recipient = null;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - regular case', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 55;

	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3, no check_answered', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3 and check_answered, no answer pre', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3 and check_answered, with pre answer', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - type 10, no check_answered, no pre answer', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - type 10, no check_answered, with pre answer', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 10 and check_answered, no pos answer', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 10 and check_answered, with pos answer', async () => {
	const notification = data.indicadoNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationBefore- dont send before sendDate', async () => {
	const notification = data.alunaNotificationBefore;
	const { moduleDates } = data;
	const today = new Date('2018-12-16T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationBefore- send on exact sendDate', async () => {
	const notification = data.alunaNotificationBefore;
	const { moduleDates } = data;
	const today = new Date('2018-12-17T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationBefore - send between dates', async () => {
	const notification = data.alunaNotificationBefore;
	const { moduleDates } = data;
	const today = new Date('2019-01-01T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationBefore- send on exact moduleDate', async () => {
	const notification = data.alunaNotificationBefore;
	const { moduleDates } = data;
	const today = new Date('2019-01-05T00:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationBefore - dont send after moduleDate', async () => {
	const notification = data.alunaNotificationBefore;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationAfter - dont send before sendDate', async () => {
	const notification = data.alunaNotificationAfter;
	const { moduleDates } = data;
	const today = new Date('2019-01-09T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationAfter - send on exact sendDate', async () => {
	const notification = data.alunaNotificationAfter;
	const { moduleDates } = data;
	const today = new Date('2019-01-10T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfter - send between dates', async () => {
	const notification = data.alunaNotificationAfter;
	const { moduleDates } = data;
	const today = new Date('2019-02-10T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfter - send on exact moduleDate', async () => {
	const notification = data.alunaNotificationAfter;
	const { moduleDates } = data;
	const today = new Date('2019-03-05T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfter - dont send after moduleDate', async () => {
	const notification = data.alunaNotificationAfter;
	const { moduleDates } = data;
	const today = new Date('2019-03-06T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationAfterMod3 - dont send before sendDate', async () => {
	const notification = data.alunaNotificationAfterMod3;
	const { moduleDates } = data;
	const today = new Date('2019-05-09T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - alunaNotificationAfterMod3 - send on exact sendDate', async () => {
	const notification = data.alunaNotificationAfterMod3;
	const { moduleDates } = data;
	const today = new Date('2019-05-10T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfterMod3 - send between dates', async () => {
	const notification = data.alunaNotificationAfterMod3;
	const { moduleDates } = data;
	const today = new Date('2019-05-15T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfterMod3 - send on exact moduleDate', async () => {
	const notification = data.alunaNotificationAfterMod3;
	const { moduleDates } = data;
	const today = new Date('2019-05-20T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - alunaNotificationAfterMod3 - dont send after moduleDate', async () => {
	const notification = data.alunaNotificationAfterMod3;
	const { moduleDates } = data;
	const today = new Date('2019-05-21T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});


// it('checkShouldSendNotification - dont send before correct time', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T12:20:00.000Z');
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });

// it('checkShouldSendNotification - send after correct time', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T12:40:00.000Z');
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeTruthy();
// });

// it('checkShouldSendNotification - type 15, send same moment', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T12:30:00.000Z');
// 	notification.notification_type = 15;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeTruthy();
// });

// it('checkShouldSendNotification - type 15, send less than 24h after', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
// 	notification.notification_type = 15;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });

// it('checkShouldSendNotification - type 15, dont send before', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-14T12:30:00.000Z');
// 	notification.notification_type = 15;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });

// it('checkShouldSendNotification - type 15, dont send 24h after', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
// 	notification.notification_type = 15;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });

// it('checkShouldSendNotification - type 16, send same hour', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
// 	notification.notification_type = 16;
// 	notification.when_to_send = new Date('2019-07-16T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeTruthy();
// });

// it('checkShouldSendNotification - type 16, send less than 1h after', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T13:00:00.000Z');
// 	notification.notification_type = 16;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeTruthy();
// });

// it('checkShouldSendNotification - type 16, dont send before', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T11:30:00.000Z');
// 	notification.notification_type = 16;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });

// it('checkShouldSendNotification - type 16, dont send 1h after', async () => {
// 	const notification = data.baseNotification; const today = new Date('2019-07-15T13:30:00.000Z');
// 	notification.notification_type = 16;
// 	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
// 	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
// 	await expect(result).toBeFalsy();
// });


afterAll(() => {
	sequelize.close();
});
