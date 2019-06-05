module.exports = {
	avatarImage: 'https://www.telegraph.co.uk/content/dam/news/2016/09/08/107667228_beech-tree-NEWS_trans_NvBQzQNjv4BqplGOf-dgG3z4gg9owgQTXEmhb5tXCQRHAvHRWfzHzHk.jpg?imwidth=450',
	getStarted: 'oi sou o bot',
	greetings: {
		text1: 'Olá, <first_name>! Que bom te ver por aqui 🥰',
		text2: 'Sou Donna, a assistente digital da ELAS (Escola de Liderança e Desenvolvimento). Estou aqui para ajudar você aluna ou futura aluna durante seu curso, '
		+ 'te ajudando, tirando dúvidas, lembrando suas tarefas e muito mais 😉',
		text3: 'Escolha uma das opções abaixo pra gente continuar:',
		menuOptions: ['Já sou aluna 😘', 'Quero ser aluna 🤩', 'Sobre ELAS 💁‍♀️'],
		menuPostback: ['jaSouAluna', 'queroSerAluna', 'sobreElas'],
	},
	jaSouAluna: {
		text1: '❤️',
		text2: 'Preciso localizar seu cadastro e saber quem é você, qual turma você está etc.',
		text3: 'Digite seu CPF. Só números, tá bom?',
		gif1: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/dae9dde4-6d85-462f-8ca0-7841d344ec42.gif',
		validCPF: 'Te achei! 🎉 Você está matriculada no Programa ELAS com o nome <name> e está na turma <turma>. Estou certa?',
		invalidCPF1: 'Esse CPF não é válido. Por favor, tente novamente.',
		invalidCPF2: 'Digite só números. Exemplo: 12345678911',
		menuOptions: ['Sim 😎', 'Não 😕'],
		menuPostback: ['confirmaMatricula', 'erradoMatricula'],
	},
	confirmaMatricula: {
		text1: 'Já tenho as informações da sua próxima aula:',
		text2: '📝 Você está no módulo {módulo} de 3\n🗓️ Acontecerá no sábado dia {dia} e no domingo dia {dia}\n⏰ Das {horas1} às {horas2} '
		+ '\n🏠 Será no {local}. Endereço: {endereço}',
		menuOptions: ['Entendi'],
		menuPostback: ['fim'],
	},
	erradoMatricula: {
		text1: '😳 Sem problemas. Você pode digitar seu CPF novamente ou entrar em contato com ELAS para ver o que houve.',
		menuOptions: ['Digitar Novamente', 'Falar com ELAS'],
		menuPostback: ['jaSouAluna', 'talkToElas'],
	},
	talkToElas: {
		text1: 'Combinado. Segue as informações para você entrar em contato:',
		text2: '📞 Telefones:  (11) 3587-1263 / 3587-1322\n🏠 Endereço: Alameda Santos, 200. Bela Vista, São Paulo - SP',
		text3: 'Quando resolver com ELAS venha conversar comigo novamente. No menu há os serviços que você pode acessar 🤗',
		text4: 'Até lá, que tal compartilhar ELAS para suas amigas?',
	},
	shareElas: {
		siteTitle: 'Compartilhar',
		// siteSubTitle: '',
		// imageURL: '',
		siteURL: 'https://www.facebook.com/Elas-homol-287066982237234/',
	},
	queroSerAluna: {
		text1: 'Uau!! Então vamos lá, vou enviar o que ELAS oferece 😉 Lá vai textão ...',
		text2: 'Espero que você venha aqui novamente me contando que é aluna do ELAS, hein.',
		text3: 'Enquanto isso, no menu há os serviços que você pode acessar 🤗',
		cards: [
			{
				text: 'Programa ELAS:\nÉ um treinamento intensivo de 54 horas, um programa completo de aprendizado ao longo de 3 meses. Além dos conteúdos, as alunas são mentoradas durante todo o período por meio de uma comunidade secreta exclusiva para elas. O conteúdo é extremamente prático e vivencial, dividido em 3 módulos, dentro de um ambiente exclusivo e seguro para COMPARTILHAR INFORMAÇÕES e para PROMOVER UMA EXPERIÊNCIA MEMORÁVEL no desenvolvimento comportamental das alunas.',
				url: 'https://programaelas.com.br/programa-elas/',
			},
			{
				text: 'Imersão em Autoconfiança: \nO treinamento de 6 horas tem como objetivo levar informações sobre a participação de mulheres em altos cargos de liderança, bem como gerar profunda reflexão nas participantes para mergulharem em seu autoconhecimento e terem um despertar para a autoconfiança, se desafiarem a crescer, assumindo uma posição de destaque profissional.',
				url: 'https://programaelas.com.br/imersao-autoconfianca/',
			},
			{
				text: 'Imersão em Influência:\nO treinamento de 6 horas tem como objetivo sensibilizar as mulheres quanto a sua capacidade de gerar influência e assertividade em sua comunicação, bem como estimular ações efetivas que permitam uma postura com mais segurança para exercer autoridade com empatia.',
				url: 'https://programaelas.com.br/imersao-influencia/',
			},
			{
				text: 'Workshop: Exercendo seu poder de Influência e Autoridade:\nO Workshop “Exercendo o Seu Poder de Influência e Autoridade” é uma vivência de 2h30 focada em despertar a consciência de como podemos nos comunicar melhor e gerar mais influência no ambiente de trabalho e em outros contextos de vida.O objetivo é gerar um desconforto positivo para que cada participante possa aplicar imediatamente o que vai aprender e já obter resultados diferentes no seu dia- a - dia.',
				url: 'https://programaelas.com.br/workshop-influencia-e-autoridade/',
			},
			{
				text: 'Workshop: Autoconfiança para Conquistar o Mundo:\nO Workshop “Autoconfiança para Conquistar o Mundo” é uma vivência de 2h30 que mexe com as pessoas.O objetivo é gerar reflexões importantes e aumentar o poder pessoal das participantes.Mais de 3300 mulheres já vivenciaram essa experiência e tiveram resultados importantes em suas vidas.',
				url: 'https://programaelas.com.br/workshop-autoconfianca/',
			},
			{
				text: 'Para empresas:\nCom o objetivo de oferecer ao grupo de colaboradoras de empresas uma formação completa capaz de desenvolver a autoconfiança para assumirem posições de liderança, tivemos treinamentos de sucessos em grandes empresas.',
				url: 'https://programaelas.com.br/lideranca-feminina-nas-empresas/casos-de-sucesso/',
			},
		],
	},
	sobreElas: {
		text1: 'Adoro contar sobre o Programa ELAS 😍',
		text2: 'Uma empresa focada no desenvolvimento pessoal de mulheres que desejam assumir posições de destaque nas empresas, em seus negócios ou na sociedade, '
		+ 'tendo clareza das suas potencialidades, objetivos e se permitindo ser quem verdadeiramente é.',
		text3: 'Você pode saber no nosso site: https://programaelas.com.br/quem-somos/',
		gif1: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/d9391ccd-7c7b-43c4-89cc-203ecb7b285a.gif',
		menuOptions: ['Já sou aluna 😘', 'Quero ser aluna 🤩'],
		menuPostback: ['jaSouAluna', 'queroSerAluna'],
	},
	issueText: {
		success: 'Obrigado por sua mensagem',
		failure: 'Não consegui salvar a mensagem',
	},
	eMail: {
		preCadastro: {
			assunto: 'Você comprou o elas',
			texto: 'Olá, vc comprou o curso para a turma<TURMA>. Realize o pré cadastro: <LINK>',
		},
		depoisMatricula: {
			assunto: 'Bem-vindo ao elas',
			texto: 'Olá, <NOME>. Vc já conheçe a Dona? m.me/287066982237234',
		},
	},
};
