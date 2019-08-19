const { sequelize } = require('../app/server/models/index');

const sendNotificationQueue = require('../app/utils/sendNotificationQueue');
const data = require('./mock_data');

process.env.NODE_ENV = 'prod';

it('checkShouldSendRecipient - no recipient', async () => {
	const notification = data.baseNotification; const recipient = null;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - regular case', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 55;

	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3, no check_answered', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3 and check_answered, no answer pre', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 3 and check_answered, with pre answer', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - type 10, no check_answered, no pre answer', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendRecipient - type 10, no check_answered, with pre answer', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 10 and check_answered, no pos answer', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendRecipient - type 10 and check_answered, with pos answer', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - same moment', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T12:30:00.000Z');
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - dont send before correct time', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T12:20:00.000Z');
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - send after correct time', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T12:40:00.000Z');
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 15, send same moment', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T12:30:00.000Z');
	notification.notification_type = 15;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 15, send less than 24h after', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
	notification.notification_type = 15;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 15, dont send before', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-14T12:30:00.000Z');
	notification.notification_type = 15;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 15, dont send 24h after', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
	notification.notification_type = 15;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 16, send same hour', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-16T12:30:00.000Z');
	notification.notification_type = 16;
	notification.when_to_send = new Date('2019-07-16T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 16, send less than 1h after', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T13:00:00.000Z');
	notification.notification_type = 16;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 16, dont send before', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T11:30:00.000Z');
	notification.notification_type = 16;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 16, dont send 1h after', async () => {
	const notification = data.baseNotification; const today = new Date('2019-07-15T13:30:00.000Z');
	notification.notification_type = 16;
	notification.when_to_send = new Date('2019-07-15T12:30:00.000Z');
	const result = await sendNotificationQueue.checkShouldSendNotification(notification, today);
	await expect(result).toBeFalsy();
});


afterAll(() => {
	sequelize.close();
});
