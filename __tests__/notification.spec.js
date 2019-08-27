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

it('findCurrentModulo - mod 1', async () => {
	const { moduleDates } = data;
	const today = new Date('2019-01-03T12:30:00.000Z');
	const result = await sendNotificationQueue.findCurrentModulo(moduleDates[0], today);
	await expect(result === 1).toBeTruthy();
});

it('findCurrentModulo - mod 2 same day', async () => {
	const { moduleDates } = data;
	const today = new Date('2019-03-05T12:30:00.000Z');
	const result = await sendNotificationQueue.findCurrentModulo(moduleDates[0], today);
	await expect(result === 2).toBeTruthy();
});

it('findCurrentModulo - mod 2 one day before mod 3', async () => {
	const { moduleDates } = data;
	const today = new Date('2019-05-04T12:30:00.000Z');
	const result = await sendNotificationQueue.findCurrentModulo(moduleDates[0], today);
	await expect(result === 2).toBeTruthy();
});

it('findCurrentModulo - mod 3', async () => {
	const { moduleDates } = data;
	const today = new Date('2019-05-07T12:30:00.000Z');
	const result = await sendNotificationQueue.findCurrentModulo(moduleDates[0], today);
	await expect(result === 3).toBeTruthy();
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

// 15 ----------

it('checkShouldSendNotification - type15notification - dont send before sendDate', async () => {
	const notification = data.type15notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-03T18:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type15notification - send', async () => {
	const notification = data.type15notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-04T15:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type15notification - dont send after moduleDate', async () => {
	const notification = data.type15notification;
	const { moduleDates } = data;
	const today = new Date('2019-05-06T15:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type16notification - saturday - dont send before sendDate', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-04T15:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type16notification - saturday - send exactly one hour before', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-05T09:00:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type16notification - saturday - send between dates', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-05T09:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type16notification - saturday - dont send after moduleDates', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-05T12:30:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type16notification - sunday - dont send before sendDate', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T03:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type16notification - sunday - send between', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T13:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type16notification - sunday - dont send after moduleDates', async () => {
	const notification = data.type16notification;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

// // 3 e 10 - no check_answer

it('checkShouldSendNotification - indicadoNotification 3 - no check_answer - dont send before', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = false;
	const { moduleDates } = data;
	const today = new Date('2018-12-25T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 3 - no check_answer - send between', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = false;
	const { moduleDates } = data;
	const today = new Date('2018-12-30T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - indicadoNotification 3 - no check_answer - dont send after', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = false;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 10 - no check_answer - dont send before', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-04-25T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 10 - no check_answer - send between', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = false;
	const { moduleDates } = data;
	const today = new Date('2019-05-01T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - indicadoNotification 10 - no check_answer - dont send after', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = false;
	const { moduleDates } = data;
	const today = new Date('2019-05-06T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

// 3 e 10 - with check_answer

it('checkShouldSendNotification - indicadoNotification 3 - with check_answer - dont send before', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-01-31T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 3 - with check_answer - send between', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-01-04T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - indicadoNotification 3 - with check_answer - dont send after', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 3; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-01-06T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 10 - with check_answer - dont send before', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-04-22T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - indicadoNotification 10 - with check_answer - send between', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-05-01T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - indicadoNotification 10 - with check_answer - dont send after', async () => {
	const notification = data.indicadoNotification; notification.notification_type = 10; notification.check_answered = true;
	const { moduleDates } = data;
	const today = new Date('2019-05-06T23:50:00.000Z');

	const result = await sendNotificationQueue.checkShouldSendNotification(notification, moduleDates, today);
	await expect(result).toBeFalsy();
});


afterAll(() => { sequelize.close(); });
