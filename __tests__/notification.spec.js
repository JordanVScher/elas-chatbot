const { sequelize } = require('../app/server/models/index');

const sendNotificationQueue = require('../app/utils/sendNotificationQueue');
const data = require('./mock_data');

// if checkShouldSendNotification returns true we can send that notification
it('checkShouldSendNotification - no recipient ', async () => {
	const notification = data.baseNotification; const recipient = null;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - regular case ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 55;

	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 3, no check_answered  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 3 and check_answered, no answer pre  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 3 and check_answered, with pre answer  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 3; notification.check_answered = true;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 10, no check_answered, no pre answer  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

it('checkShouldSendNotification - type 10, no check_answered, with pre answer  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = false;
	recipient['respostas.pre'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 10 and check_answered, no pos answer  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = {};
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeTruthy();
});

it('checkShouldSendNotification - type 10 and check_answered, with pos answer  ', async () => {
	const notification = data.baseNotification; const recipient = data.baseRecipientIndicado;
	notification.notification_type = 10; notification.check_answered = true;
	recipient['respostas.pos'] = { foo: 'bar' };
	const result = await sendNotificationQueue.checkShouldSendRecipient(recipient, notification);
	await expect(result).toBeFalsy();
});

afterAll(() => {
	sequelize.close();
});
