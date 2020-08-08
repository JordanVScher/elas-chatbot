module.exports = {
	up(queryInterface, Sequelize) {
		return queryInterface.createTable('sm_answer_event_log', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			sm_event_id: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			sm_survey_id: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			answer_sm_id: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});
	},
	down(queryInterface) {
		return queryInterface.dropTable('sm_answer_event_log');
	},
};
