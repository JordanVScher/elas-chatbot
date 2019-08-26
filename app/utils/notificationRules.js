const notificationRules = [
	{ notification_type: 1, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }] },
	{ notification_type: 2, modulo: 1, timeChange: [{ qtd: -19, type: 'days' }, { qtd: 5, type: 'minutes' }] },
	{ notification_type: 3, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }], indicado: true, reminderDate: 6 }, // eslint-disable-line object-curly-newline
	{ notification_type: 4, modulo: 1, timeChange: [{ qtd: -10, type: 'days' }] },
	{ notification_type: 5, modulo: 1, timeChange: [{ qtd: 5, type: 'days' }] },
	{ notification_type: 6, modulo: 2, timeChange: [{ qtd: -12, type: 'days' }] },
	{ notification_type: 7, modulo: 2, timeChange: [{ qtd: 5, type: 'days' }] },
	{ notification_type: 8, modulo: 2, timeChange: [{ qtd: 5, type: 'days' }] },
	{ notification_type: 9, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
	{ notification_type: 10, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], indicado: true, reminderDate: 3 }, // eslint-disable-line object-curly-newline
	{ notification_type: 11, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }] },
	{ notification_type: 12, modulo: 3, timeChange: [{ qtd: -12, type: 'days' }], indicado: true, familiar: true }, // eslint-disable-line object-curly-newline
	{ notification_type: 13, modulo: 3, timeChange: [{ qtd: -1, type: 'days' }] },
	{ notification_type: 14, modulo: 3, timeChange: [{ qtd: 5, type: 'days' }] },
	// Receive notification 24h before every class
	{ notification_type: 15, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	{ notification_type: 15, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -24, type: 'hours' }] },
	// Receive notification 1h before every class, on saturday (-1h) and sunday (saturday + 23h)
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: -1, type: 'hours' }] },
	{ notification_type: 16, modulo: 1, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 2, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
	{ notification_type: 16, modulo: 3, timeChange: [{ qtd: 0, type: 'days' }, { qtd: 23, type: 'hours' }] },
];


// return the sum of the module date (from the turma) with the notification rule
async function getSendDate(ourTurma, currentRule, i) {
	if (process.env.NODE_ENV === 'prod') {
		const desiredDatahora = `modulo${currentRule.modulo}`;

		if (ourTurma) {
			const dataResult = new Date(ourTurma[desiredDatahora]);
			currentRule.timeChange.forEach((element) => {
				// Negative qtd means amount of time before the date. Positive means after.
				if (element.type === 'days') {
					dataResult.setDate(dataResult.getDate() + element.qtd);
				} else if (element.type === 'hours') {
					dataResult.setHours(dataResult.getHours() + element.qtd);
				} else if (element.type === 'minutes') {
					dataResult.setMinutes(dataResult.getMinutes() + element.qtd);
				}
			});

			return dataResult;
		}
		return false;
	}

	const today = new Date();
	const toAdd = (i + 1) * 3;
	today.setMinutes(today.getMinutes() + toAdd);
	return today;
}

module.exports = {
	getSendDate, notificationRules,
};


// async function checkShould1SendNotification(notification, today) {
// 	if (!notification) { return false;	}

// 	const toSend = help.moment(notification.when_to_send); // get moment to send the notification
// 	if (process.env.NODE_ENV === 'prod') {
// 		if (notification.notification_type !== 15 && notification.notification_type !== 16) { // notification 15 and 16 have a different day rule
// 			if (today >= toSend) { return true; }	// check if date toSend happens beore today, if it was not sent back then it can be sent now
// 		}

// 		const diffHour = toSend.diff(today, 'hours'); // difference between today and the hour the notification has to be sent

// 		if (notification.notification_type === 15) {
// 			if (diffHour <= 0 && diffHour > -23) { return true; } // this type can only be sent less than 24h after the notification.toSend
// 		} else if (notification.notification_type === 16) {
// 			if (diffHour === 0 && today >= toSend) { return true; } // this type can only be sent less than 1h after the notification.toSend
// 		}

// 		return false;
// 	}

// 	const diffMinutes = toSend.diff(today, 'minutes');
// 	if (diffMinutes > 0) { return false; }

// 	return true;
// }
