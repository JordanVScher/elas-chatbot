const data = [];

const regularMail = {
	assunto: 'Bem vinda à Escola ELAS!',
	texto1: 'Querida Aluna! Vamos iniciar sua jornada no Programa ELAS - <strong>TURMARESPOSTA</strong>.\nO primeiro passo é realizar a sua matrícula. Basta clicar no botão abaixo:',
	texto2: 'Em breve você receberá mais dois e-mails com as informações necessárias para o módulo 1 e também com as pré atividades.\n',
	texto3: 'Você comprou o curso para outra pessoa e não é a aluna? Tudo bem, basta enviar esse e-mail para ela realizar a própria matrícula, ok?',
	texto4: 'CASO VOCÊ JÁ TENHA RESPONDIDO O QUESTIONÁRIO DE MATRÍCULA, FAVOR DESCONSIDERAR E AGUARDAR OS PRÓXIMOS PASSOS QUE SERÃO ENVIADOS EM BREVE.',
	in_company: false,
	created_at: new Date(),
	updated_at: new Date(),
};

const inCompanyMail = {
	assunto: 'Bem vinda ao Programa Elas',
	texto1: 'Você acaba de entrar para a turma do Programa Elas <strong>TURMARESPOSTA</strong>. Parabéns!\nVamos iniciar com a sua matrícula. Basta clicar no botão abaixo:',
	texto2: '',
	texto3: 'Agora é só aguardar os próximos passos que serão enviados em breve!',
	texto4: '',
	in_company: true,
	created_at: new Date(),
	updated_at: new Date(),
};

data.push(regularMail);
data.push(inCompanyMail);


module.exports = {
  up(queryInterface, Sequelize) { // eslint-disable-line
		return queryInterface.bulkInsert('mail_atividade1', data);
	},

	down(queryInterface, Sequelize) {
		return queryInterface.bulkDelete(
			'mail_atividade1',
			{ id: { [Sequelize.Op.gte]: 1 } }, {},
		);
	},
};
