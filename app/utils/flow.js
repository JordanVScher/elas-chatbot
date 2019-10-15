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
	mainMenu: {
		defaultText: 'O que deseja fazer?',
		menuOptions: ['Falar com Donna 💻', 'Sobre ELAS 💁‍♀️'],
		menuPostback: ['falarDonna', 'sobreElas'],
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
		after1: 'Por aqui vou te enviar todas as notificações importantes durante o curso, como as atividades pré e pós módulos, etc. Também te lembrarei as datas, horas, locais dos módulos, te enviarei os links importantes das atividades e se quiser bater um papo comigo, responderei o que souber 😍',
		// text2: '📝 Você está no módulo {módulo} de 3\n🗓️ Acontecerá no sábado dia {dia} e no domingo dia {dia}\n⏰ Das {horas1} às {horas2} '
		// + '\n🏠 Será no {local}. Endereço: {endereço}',
		menuOptions: ['Entendi'],
		menuPostback: ['afterConfirma'],
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
	// shareElas: {
	// 	siteTitle: 'Compartilhar',
	// 	// siteSubTitle: '',
	// 	// imageURL: '',
	// 	siteURL: 'https://www.facebook.com/Elas-homol-287066982237234/',
	// },
	queroSerAluna: {
		text1: 'Uau!! Então vamos lá, vou enviar o que ELAS oferece 😉 Lá vai textão ...',
		text2: 'Espero que você venha aqui novamente me contando que é aluna do ELAS, hein.',
		text3: 'Enquanto isso, no menu há os serviços que você pode acessar 🤗',
		menuOptions: ['Já sou aluna 😘', 'Sobre ELAS 💁‍♀️'],
		menuPostback: ['jaSouAluna', 'sobreElas'],
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
				text: 'Workshop: Exercendo seu poder de Influência e Autoridade:\nO Workshop “Exercendo o Seu Poder de Influência e Autoridade” é uma vivência de 2h30 focada em despertar a consciência de como podemos nos comunicar melhor e gerar mais influência no ambiente de trabalho e em outros contextos de vida.O objetivo é gerar um desconforto positivo para que cada participante possa aplicar imediatamente o que vai aprender e já obter resultados diferentes no seu dia-a-dia.',
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
		success: 'Obrigado por sua mensagem, vamos tentar te responder em breve',
		failure: 'Não consegui salvar a mensagem',
	},
	eMail: {
		atividade1: {
			assunto: 'Obrigada por sua compra! - Programa ELAS',
			texto: 'mail_template/ELAS_Matricula.html',
		},
		depoisMatricula: {
			assunto: 'Matrícula Confirmada. Conheça a Donna! - Programa ELAS',
			texto: 'mail_template/ELAS_Apresentar_Donna.html',
		},
	},
	Atividade2: {
		text1: 'Para garantir a melhor experiência possível, é importante que você complete as 3 atividades prévias até [MOD1_15DIAS], ok? Abaixo seguem essas atividades:',
		text2: 'A atividade 3, você receberá no [MOD1_2DIAS]. Imprima e leve para receber uma devolutiva no primeiro módulo 😉\n\nMãos à obra e prepare-se para uma grande jornada!!',
		menuOptions: ['Ok'],
		menuPostback: ['mainMenu'],
		cards: [
			{
				title: 'ATIVIDADE 1 - RELAÇÃO DE AVALIADORES',
				subtitle: 'Como as pessoas te avaliam? Indique no mín. 4 pessoas do seu convívio.',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/8619ef7a-f963-415b-a14d-491382fc11fc.jpg',
				url: process.env.INDICACAO360_LINK,
			},
			{
				title: 'ATIVIDADE 2 - SONDAGEM DE FOCO',
				subtitle: 'Sobre a sua evolução pessoal, algo que mediremos no final do programa.',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/c8cc8280-7c73-4caf-a07c-2a84bdd4bb93.jpg',
				url: process.env.SONDAGEM_PRE_LINK,
			},
			{
				title: 'ATIVIDADE 3 - INVENTÁRIO COMPORTAMENTAL',
				subtitle: '"Descobrir" o seu potencial e suas habilidades.Preencha em um momento calmo.',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/9f6a19c4-571b-429f-b628-8ef4cedda1a9.jpg',
				url: process.env.DISC_LINK1,
			},
		],
	},
	mail6pt2: {
		text1: `Escolha uma situação, que numa escala de desconforto de 1 a 10, tenha uma nota média  3 ou 4. É importante pensar nesta escala e se assegurar que neste cenário você tenha ficado um pouco desconfortável. Evite situações traumáticas onde o seu emocional ficou abalado.
	\nEssa cena pode ter acontecido com um chefe, um colega de trabalho, alguém mais íntimo, enfim. Você deve descrever a história exata que te promoveu o desconforto e porque essa situação não foi bem resolvida da forma que você almejava. Simplesmente descreva a história em um papel. Você deverá trazê-la em sala de aula para discutirmos no Módulo 2.
	\nAgora vamos para a segunda parte da atividade, beleza?`,
		menuOptions: ['Vamos!'],
		menuPostback: ['mail6pt3'],
	},
	mail6pt3: {
		text1: 'Após escrever a história, você deve ler o texto. Clique no link abaixo e leia atentamente, faça suas observações e leve-as para a sala de aula. \n<LINK_ANEXO>',
		menuOptions: ['Ok'],
		menuPostback: ['mainMenu'],
	},
	adminMenu: {
		firstMenu: {
			txt1: 'Esse é o menu do admin. Clique em uma opção:',
			menuOptions: ['Inserir Alunas', 'Inserir Avaliadores', 'Ver Turma', 'Mudar Turma'],
			menuPostback: ['inserirAlunas', 'inserirAvaliadores', 'verTurma', 'mudarTurma'],
		},
		inserirAlunas: {
			txt1: 'Envie o CSV com os dados das novas alunas. As colunas devem estar formatadas como esse arquivo de exemplo:',
			txt2: 'É necessário que cada aluna tenha o nome completo, o CPF e pertencer a uma turma válida! Se o CPF já estiver cadastrado, os dados da aluna serão atualizados com os valores no CSV (se houver algum).',
			invalidFile: 'Erro! Verifique se o arquivo CSV está formatado corretamente e envie novamente!',
			menuOptions: ['Voltar'],
			menuPostback: ['adminMenu'],
		},
		inserirAvaliadores: {
			txt1: 'Envie o CSV com os dados dos novos avaliadores. As colunas devem estar formatadas como esse arquivo de exemplo:',
			txt2: 'É necessário que cada avaliador tenha o nome completo, o e-mail, assim como o CPF de uma Aluna! Se o o mesmo e-mail já estiver cadastrado naquela aluna, os dados do avaliador serão atualizados com os valores no CSV (se houver algum).'
			+ '\nDetalhe: Para transformar um avaliador em "Familiar", adicione a palavra "Sim" na coluna "Familiar". Para que o avaliador deixe de ser Familiar, escreva "Não". Todos os outros valores serão ignorados e não mudarão o estado de familiar do Avaliador',
			invalidFile: 'Erro! Verifique se o arquivo CSV está formatado corretamente e envie novamente!',
			menuOptions: ['Voltar'],
			menuPostback: ['adminMenu'],
		},
		verTurma: {
			txt1: 'Aqui você poderá baixar um CSV com os dados das alunas de uma turma. Digite a turma, exemplo: T1-SP.',
			txt2: 'Se quiser os dados de outra turma basta digitar novamente.',
			menuOptions: ['Voltar'],
			menuPostback: ['adminMenu'],
		},
		mudarTurma: {
			txt1: 'Entre o CPF da Aluna que deseja mudar de turma. Pode ser só números. \nSe não souber o CPF, baixe o CSV com as informações da turma clicando no botão abaixo.',
			invalidCPF: 'CPF inválido. Tente novamente.',
			alunaNotFound: 'Não encontrei nenhuma aluna com esse CPF. Tente novemente.',
			alunaFound: 'Aluna encontrada:\n\n',
			txt2: 'Entre com a turma para transerir a aluna. Hoje, <NOME> está na turma <TURMA>.',
			transferComplete: 'Aluna foi transferida para turma <TURMA> com sucesso!',
			transferFailed: 'Um erro aconteceu, tente novamente!',
			turmaInvalida: 'Turma inválida! Não existe nenhuma aluna nessa turma! Adicione alguma aluna nessa turma antes de transferir alguém pra lá!',
			turmaCount: 'Agora existem <COUNT> aluna(s) na turma <TURMA>.',
			menuOptions: ['Voltar', 'Ver Turma'],
			menuPostback: ['adminMenu', 'verTurma'],
		},
		notAdmin: 'Você não é admin!',
		errorMsg: 'Escreva novamente ou escolha uma das opções!',
	},
	adminCSV: {
		alunosTurmaCSV: {
			txt1: 'Alunas da Turma:',
			error: 'Não encontrei nenhuma aluna nessa turma!',
			filename: 'TURMA_<INPUT>',
		},
		alunosRespostasCSV: {
			txt1: 'Controle de preenchimento das atividades:',
			error: 'Não encontrei nenhuma resposta nessa turma!',
			filename: 'RESPOSTAS_TURMA_<INPUT>',
		},
		indicadosCSV: {
			txt1: 'Indicados da turma:',
			error: 'Não encontrei nenhum indicado nessa turma!',
			filename: 'INDICADOS_TURMA_<INPUT>',
		},
	},
	missingAnswersWarning: {
		mailSubject: 'Questionário não respondido',
		mailText: 'Baixe o arquivo abaixo para visualizar quem não respondeu os questionários para a próxima aula',
	},
	notifications: {
		on: 'Legal! Estarei te interando das novidades! Se quiser parar de receber nossas novidades, clique na opção "Parar Notificações 🛑" no menu abaixo. ⬇️',
		off: 'Você quem manda. Não estarei mais te enviando nenhuma notificação. Se quiser voltar a receber nossas novidades, clique na opção "Ligar Notificações 👌" no menu abaixo. ⬇️',
	},
};
