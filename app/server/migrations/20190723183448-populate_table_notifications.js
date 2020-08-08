require('dotenv').config();

const notifications = {
	mail1: {
		subject: 'Informações importantes sobre seu curso - Programa ELAS',
		text: `Olá, [NOMEUM],

Está chegando o grande dia, né?
No final de semana do [MODULO1] iniciaremos uma grande jornada de aprendizado. Está preparada? Esperamos que você esteja animada, porque nós estamos muito ;-)

Todos os módulos serão realizados no
LOCAL - [LOCAL]

Nos dias:
[FDSMOD1]
[FDSMOD2]
[FDSMOD3]

Importante chegar pontualmente!

Outras informações importantes:
Procure ir com roupas confortáveis para aproveitar melhor o dia que
será intenso. Iniciaremos o dia com um café da manhã reforçado. O almoço e estacionamento não estão inclusos.

Você irá participar de um grupo exclusivo da turma no Whatsapp.
Para fazer parte clique no link abaixo:

[GRUPOWHATS]

Fique atenta ao seu email, você receberá na sequência algumas pré-atividades para serem feitas. Lembrando também, caso ainda não conheça, você pode acompanhar essas notificações pela Donna, nossa asistente virtual. Clique Aqui [LINKDONNA]

Beijos,
Equipe ELAS`,
		chatbotText: `Olá, [NOMEUM],
Está chegando o grande dia, né? No final de semana do dia (início do Módulo 1) 

Todos os módulos serão realizados no
LOCAL - [LOCAL]

Nos dias: [FDSMOD1]; [FDSMOD2]; [FDSMOD3]

Importante chegar pontualmente! Procure ir com roupas confortáveis para aproveitar melhor o dia que será intenso. Iniciaremos o dia com um café da manhã reforçado. O almoço e estacionamento não estão inclusos 😘

Vou te mandar por aqui também as atividades necessárias em cada módulo!`,
		chatbotButton: [
			{ content_type: 'text', title: 'Entendi', payload: 'Atividade2' },
		],
	},
	mail2: {
		subject: 'Atividades Pré-Treinamento - PROGRAMA ELAS',
		text: `Olá, [NOMEUM],  tudo bem?

Está chegando o dia de início do Programa ELAS - [TURMA]!!!
Preparada ? Estamos ansiosas para promover para você uma experiência
incrível!!!

E para garantir a melhor experiência possível, é importante que você complete
as 4 atividades prévias até [MOD1_15DIAS], ok ?


ATIVIDADE 1 - RELAÇÃO DE AVALIADORES - Como as pessoas te avaliam?
Acreditamos muito que esse processo irá impactar muito a sua forma de agir e se relacionar com as pessoas e para que possamos avaliar se realmente existirá uma mudança, é importante que você relacione algumas pessoas do seu convívio para te avaliar.  Basta clicar no link abaixo e relacionar as pessoas e e-mails, que nós entraremos em contato enviando o link de avaliação para elas.
Você deve indicar no mínimo 4 pessoas (os detalhes estão dentro do questionário)

Clique no link e preencha (Avaliadores 360)
[INDICACAO360]

ATIVIDADE 2 - SONDAGEM DE FOCO
Essa atividade é importante por que será o ponto de partida sobre a sua evolução pessoal, algo que mediremos no final do programa.  

Clique no link e preencha: [SONDAGEMPRE]

ATIVIDADE 3 - SEU INVENTÁRIO COMPORTAMENTAL
Essa atividade é para "descobrir" o seu potencial, suas habilidades
por meio de um grande inventário comportamental.  
Você deve preencher em um momento calmo e sem interrupções. Levará no máximo 12 minutos. Então vai ser simples.  

Após receber até [MOD1_2DIAS], você deverá imprimir e levar para darmos uma devolutiva no primeiro módulo ;-)

Copie o link, cole no seu navegador web e preencha:
[DISC_LINK]

Mãos à obra e prepare-se para uma grande jornada!!

Lembrando também, caso ainda não conheça, você pode acompanhar essas notificações pela Donna, nossa asistente virtual. Clique Aqui [LINKDONNA]

Qualquer dúvida, estamos à disposição.
Beijos, Equipe ELAS
`,
	},
	mail3: {
		subject: 'Você foi convidado(a) para avaliar a [NOMEUM]',
		text: `Olá! Aqui é Vania, do Programa ELAS, tudo bem?

Quem me passou o seu contato foi a [NOMEUM]. Ela está fazendo um treinamento de liderança, autoconhecimento e influência, e pedimos sua ajuda para que a avalie para ajudar nas atividades do treinamento.

Não divulgaremos seu nome, então fique à vontade para responder com transparência e honestidade, ok? É extremamente importante que você responda com sinceridade para que o desenvolvimento dela seja otimizado. 

O teste leva em torno de 15 a 25 minutos, dependendo do nível de detalhamento e profundidade das suas respostas. Sabemos que seu tempo é precioso, e tenho certeza que com a sua ajuda a [NOMEUM] se desenvolverá ainda mais.

Clique no link abaixo para iniciar questionário:

[AVALIADORPRE]

Quanto ao prazo, o questionário deve ser preenchido até [MOD1_2DIAS]. Posso contar contigo?

**Caso já tenha respondido, desconsidere este e-mail.

Muito obrigada,
Atenciosamente,
Vania Teofilo
Equipe ELAS`,
	},
	mail4: {
		subject: 'Lembre seus avaliadores - Programa ELAS',
		text: `Olá, [NOMEUM]!

Para ajudar que todos os seus indicados façam o preenchimento do questionário, pedimos que você também envie para eles o link para preenchimento.
Percebemos que assim eles respondem mais rápido do que quando nós enviamos. 😉

Segue um modelo de texto que você pode usar para pedir a eles que façam a avaliação e o link do questionário.
-------------------------------------------------------------------------------------------------
Olá,

Estou muito feliz em compartilhar que estou participando de um treinamento de Liderança chamado Programa ELAS.  
Será uma jornada intensa e gostaria de contar com a sua ajuda.
Participarei de uma avaliação 360 e escolhi você para ser um dos meus avaliadores,
Será uma avaliação que levará entre 15 e 25 minutos, basta clicar no link abaixo e preencher. Tudo bem?

[AVALIADORPRE]

Agradeço muito você preencher até [MOD1_2DIAS]!

Muito obrigada desde já!!
Abraços,

------------------------------------------------------------------------------------------------------

[NOMEUM],

Nós também enviaremos por e-mail esse link para eles, mas um reforço seu nos ajudará muito!!

Qualquer dúvida estamos a disposição,
Abraços,
Equipe ELAS`,
		chatbotText: `Oi, [NOMEUM]! 
Nós enviamos para os seus indicados o link para o preenchimento do questionário.Mas sabe uma coisa que ajuda também? Você falar com eles pedindo o preenchimento. Que tal? 😃`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	mail5: {
		subject: 'Como foi o módulo 1 para você? Conte para a gente! - Programa ELAS',
		text: `Olá, [NOMEUM],

Conforme falamos em sala, segue o link para que você avalie como foi a sua experiência neste 1° módulo. A cada módulo você receberá um link diferente para nos dar seu feedback. Sua colaboração é fundamental para que saibamos como tornar a sua experiência ainda melhor.

Para avaliar esse módulo, clique aqui: 
[AVALIACAO1]

E nunca se esqueça: confie no processo!!!!!

Beijos,
Equipe ELAS`,
		chatbotText: 'Olá, [NOMEUM]! E aí, como foi seu primeiro módulo? Espero que tenha aprendido muito! Para que nós saibamos como tornar sua experiência ainda melhor, você pode clicar no link abaixo e dar seu feedback sobre esse módulo?\n[AVALIACAO1]',
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	mail6: {
		subject: 'Leitura Prévia Módulo 2 -  Programa ELAS',
		text: `Olá, [NOMEUM]!

Está chegando o 2° módulo!!! Como o tempo passa rápido não é? Você está preparada? 

Confie no processo!!! E vem com a gente para um fim de semana cheio de aprendizado com muitas ferramentas e técnicas práticas para fazer você chegar no seu destino!!!  

Estamos aqui a todo vapor, e para que você venha preparada, temos duas tarefas prévias para você!

1 - Você deve pensar em um cenário onde existiu uma situação desconfortável para você (que aparentemente está mal resolvida) seja porque a conversa não foi do jeito que você queria, ou porque não existiu uma conversa que deveria ter acontecido. Ou seja, traga uma situação que você ficou um pouco desconfortável.

Escolha uma situação, que numa escala de desconforto de 1 a 10, tenha uma nota média  3 ou 4. É importante pensar nesta escala e se assegurar que neste cenário você tenha ficado um pouco desconfortável. Evite situações traumáticas onde o seu emocional ficou abalado.

Essa cena pode ter acontecido com um chefe, um colega de trabalho, alguém mais íntimo, enfim. Você deve descrever a história exata que te promoveu o desconforto e porque essa situação não foi bem resolvida da forma que você almejava. Simplesmente descreva a história em um papel. Você deverá trazê-la em sala de aula para discutirmos no Módulo 2.

2 - Após escrever a história, você deve ler o texto em anexo.

Leia atentamente, faça suas observações e leve-as para a sala de aula.

Lembrando também, caso ainda não conheça, você pode acompanhar essas notificações pela Donna, nossa asistente virtual. Clique Aqui [LINKDONNA]


Qualquer dúvida estamos à disposição.
Beijos,
Equipe ELAS`,
		anexo: 'domine_suas_historias',
		anexoLink: process.env.ANEXO_MAIL06,
		chatbotText: `Oi, [NOMEUM]!!
\nEstá chegando o 2° módulo!!! Como o tempo passa rápido não é ? Você está preparada ? Estou aqui para te passar as atividades do módulo 2. Vamos lá ?
\n1 - Você deve pensar em um cenário onde existiu uma situação desconfortável para você(que aparentemente está mal resolvida) seja porque a conversa não foi do jeito que você queria, ou porque não existiu uma conversa que deveria ter acontecido.Ou seja, traga uma situação que você ficou um pouco desconfortável.`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mail6pt2' },
		],
	},
	mail7: {
		subject: 'Apresentação Final de Curso - Programa ELAS',
		text: `Olá, [NOMEUM],

No domingo, [MOD3_LASTDAY], faremos nossa formatura e para isso cada aluna terá que formar uma dupla e fazer uma apresentação de impacto com no máximo 5 minutos para as duas. Essa apresentação deverá ser preferencialmente em dupla.

Regras para apresentação:
A apresentação pode ser feita da forma como vocês desejarem, não há formato ou conteúdo fechado. Traga a sua verdade e fale com o seu coração. Este é um momento especial de compartilhamento com as suas colegas de turma.

Caso vocês duas optem por fazer uma apresentação que utilize algum conteúdo de mídia (música, fotos, slides), envie via email, até [MOD3_2DIAS], no email: [EMAILMENTORIA]. Também é bom trazer uma cópia no pen drive para garantir.

A apresentação deve levar em conta a sua história e trazer de forma objetiva exemplos concretos do seu aprendizado aplicados na vida prática. 

Nossos convidados estão esperando ansiosamente por esta apresentação.
Será no domingo iniciando na parte da manhã!

Abraços,
Equipe ELAS`,
		chatbotText: `Donna, de novo! 🤗
No seu último dia do módulo 3, [MOD3_LASTDAY], faremos nossa formatura 🥰. Então fique atenta do que você deve fazer:

1- Forme uma dupla
2- Façam uma apresentação de impacto de no máximo 5 min
3- A apresentação deve levar em conta a sua história e trazer de forma objetiva exemplos concretos do seu aprendizado aplicados na vida prática. 

Regras? A apresentação pode ser feita da forma como vocês desejarem. Este é um momento especial de compartilhamento com as suas colegas de turma.

Importante: Caso vocês duas optem por fazer uma apresentação que utilize algum conteúdo de mídia (música, fotos, slides), envie o arquivo / conteúdo via e-mail, até [MOD3_2DIAS], para: [EMAILMENTORIA]. Também é bom trazer uma cópia no pen drive para garantir.

Combinado? Até lá 🤩`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	mail8: {
		subject: 'Como foi o módulo 2 para você? Conte para a gente! - Programa ELAS',
		text: `Olá, [NOMEUM],
Conforme falamos em sala, segue o link para que você avalie a sua experiência no 2° módulo. Seu feedback é imprescindível para que possamos melhorar constantemente. E lembre-se sempre: Confie no processo!!!!
		
Basta clicar no link abaixo: 
		
[AVALIACAO2]
		
Beijos,
Equipe ELAS`,
		chatbotText: `Olá, [NOMEUM]! E aí, como foi seu segundo módulo? Estou contente de te ver até aqui! 

Para que nós saibamos como tornar sua experiência ainda melhor, você pode clicar no link abaixo e dar seu feedback sobre esse módulo?  

[AVALIACAO2]`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	mail9: {
		subject: '[Atividades Prévias para o Último Módulo] - Programa ELAS',
		text: `Olá, [NOMEUM], tudo bem?

Está chegando a formatura do Programa ELAS - [TURMA]!!!

E para garantir a melhor experiência possível, é importante que você complete as 3 atividades prévias até [MOD3_7DIAS], ok?

ATIVIDADE 01 - SONDAGEM DE FOCO
Precisamos que você preencha novamente a Sondagem de Foco, para avaliarmos a mudança percebida por você.
Segue o link:
[SONDAGEMPOS]

ATIVIDADE 02 - SEU INVENTÁRIO COMPORTAMENTAL
Outra atividade que você também deverá refazer é o DISC.
Copie o link, cole no seu navegador web e preencha:

[DISC_LINK]

ATIVIDADE 03 - LEITURA PRÉVIA
No Módulo 3 trabalharemos técnicas para gestão de equipes. E para você se preparar é preciso que você leia esse material e avalie como ele poderia ser implantado no seu dia-a-dia, anote as possíveis dúvidas para esclarecermos em aula!!!

O prazo para essas atividades é até [MOD3_7DIAS].

Qualquer dúvida entrem em contato com a gente!

Beijos,
Equipe ELAS`,
		anexo: 'ebook_autoridade_como_lider',
		anexoLink: process.env.ANEXO_MAIL09,
		chatbotText: 'Está chegando a formatura do Programa ELAS!! Para fecharmos com chave de ouro, vamos para as atividades que devem ser feitas até [MOD3_7DIAS] 😉',
		chatbotCard: [
			{
				title: 'ATIVIDADE 1 - SONDAGEM DE FOCO',
				subtitle: 'Preencha novamente para avaliarmos a mudança percebida por você.',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/c8cc8280-7c73-4caf-a07c-2a84bdd4bb93.jpg',
				url: process.env.SONDAGEM_POS_LINK,
			},
			{
				title: 'ATIVIDADE 2 - INVENTÁRIO COMPORTAMENTAL',
				subtitle: 'Houve mudanças? Refaça o DISC!',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/9f6a19c4-571b-429f-b628-8ef4cedda1a9.jpg',
				url: process.env.DISC_LINK2,
			},
			{
				title: 'ATIVIDADE 3 - LEITURA',
				subtitle: 'Leia e avalie como ele poderia ser implantado no seu dia-a-dia, anote as dúvidas',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/fde11d8c-e516-4fa8-8536-474d20ab99d3.jpg',
				url: process.env.ANEXO_MAIL09,
			},
		],
	},
	mail10: {
		subject: ' [ VOCÊ ESTÁ SENDO CONVIDADO(A) PARA AVALIAR A [NOMEUM] NOVAMENTE! ]',
		text: `Olá, aqui é a Vania, do Programa ELAS, tudo bem?

Entrei em contato com você há cerca de 2 meses atrás, para que você participasse de uma avaliação da [NOMEUM]. Lembra?

Ela irá concluir o treinamento e precisamos da sua avaliação novamente. O preenchimento do questionário levará em torno de 10 a 20 minutos. 

Esta avaliação é fundamental, pois comparamos as mudanças que ela conquistou,  fortalecendo assim os aprendizados!

Basta clicar no link abaixo:

[AVALIADORPOS]

Quanto ao prazo você, pode responder até [MOD3_7DIAS].
Contamos com você!

PS: Lembrando que não divulgaremos seu nome, então pode responder o mais transparente possível, ok?

**Caso já tenha respondido, desconsidere este e-mail

Atenciosamente,
Vania Teofilo
Equipe ELAS`,
	},
	mail11: {
		subject: 'Lembre seus avaliadores - Programa ELAS',
		text: `Olá, [NOMEUM]!!

Está chegando o dia de conclusão do Programa ELAS!! E como atividade, temos o fechamento da avaliação 360, ou seja ela deverá ser preenchida novamente pelos seus avaliadores (os mesmos convidados da primeira vez). Criamos um e-mail introdutório para você enviar, relembrando e reforçando a importância deles preencherem novamente. Combinado?

Segue um modelo para você:
--------------------------------------------------------------------------------------------
Olá _,

No [MOD3_LASTDAY] concluirei minha formação no Programa ELAS, e um modo importante de entender e avaliar o meu progresso é contando com a sua colaboração novamente.

Para acessá-la, basta clicar no link abaixo: 

[AVALIADORPOS]

Você precisa preencher até [MOD3_7DIAS], para que eu possa ter acesso aos meus resultados.

Confiante da sua atenção, desde já eu agradeço.  
Forte abraço,
--------------------------------------------------------------------------------------------

[NOMEUM],

Nós também enviaremos por e-mail esse link para eles, mas um reforço de vocês ajuda muito!!

Qualquer dúvida estamos a disposição,
Abraços,
Equipe ELAS`,
		chatbotText: `Olá!!
Está chegando o dia de conclusão do Programa ELAS!! E como atividade, temos o fechamento da avaliação 360, ou seja ela deverá ser preenchida novamente pelos seus avaliadores 

Já enviamos para os mesmos o link para o preenchimento do questionário. Mas sabe né, você falar com eles pedindo o preenchimento ajuda bastante 😉`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	mail12: {
		subject: 'Homenagem especial feita por você para [NOMEUM]',
		text: `Olá! Meu nome é Vania, e trabalho no Programa ELAS | Escola de Liderança, quem me passou seu contato foi a [NOMEUM]. Ela é aluna do nosso curso de autoconhecimento, influência e liderança, e queremos pedir a sua ajuda para prestar uma homenagem para ELA! Podemos contar com você?  
 
No domingo dia [MOD3_LASTDAY] será o último dia de aula do curso, e nós preparamos um encerramento muito especial!
 
Como será um dia marcante para ela, convidamos os familiares e/ou amigos mais próximos a ajudarem nessa homenagem (em casa, após o término do curso). Você pode usar a criatividade, lembrar de coisas que ela gosta, e organizar uma surpresa para a noite do domingo [MOD3_LASTDAY]. Pode ser uma carta carinhosa, mensagens e incentivos coletados de amigos e familiares, e o que mais você achar que ela iria gostar.
 
A ideia é que ela, ao retornar para casa, tenha uma surpresa feita por você.  
 
A mensagem principal das homenagens é para dizer "Por que você tem orgulho da [NOMEUM]" Quanto mais mensagens ela receber mais será marcante essa transformação que a levará para um novo crescimento pessoal e profissional.   
 
Podemos contar com você?  Aguardo sua confirmação para ter certeza que dará tudo certo, ok?  
 
Qualquer dúvida estarei à disposição através desse e-mail ou pelo whatsapp: [NUMBERWHATSAP]. Obrigada!

Vania Teofilo
Equipe ELAS`,
	},
	mail13: {
		subject: 'Sua evolução e feedback - Programa ELAS',
		text: `Olá, [NOMEUM]!!

Estamos na reta final! Você preencheu a Sondagem de Foco no início e no fim do curso, assim como seus indicados fizeram uma avaliação 360 sobre você. Agora é hora de ver seu gráfico de mudanças e os feedback dos seus avaliadores. 

Em anexo está seu gráfico da Sondagem de Foco com seu antes e depois e o PDF com todo o feedback dos seus avaliadores. Boa leitura!

Qualquer dúvida estamos a disposição,
Abraços,
Equipe ELAS
`,
		chatbotText: `Oi, [NOMEUM]!\nVocê preencheu a Sondagem de Foco no início e no fim do curso, assim como seus indicados fizeram uma avaliação 360 sobre você.
Veja seu gráfico da Sondagem de Foco com seu antes e depois e o PDF com todo o feedback dos seus avaliadores. Boa leitura!`,
		files: true,
	},
	mail14: {
		subject: '[ COMO FOI O PROGRAMA ELAS PARA VOCÊ? ] - Programa ELAS',
		text: `Olá, [NOMEUM],

Conforme falamos em sala, segue o link para que vocês avaliem como foi o Programa ELAS para você. Sua opinião é importante para que possamos construir uma experiência cada vez melhor!!!

Para avaliar o 3° módulo, clique aqui:  
[AVALIACAO3]

Beijos,
Equipe ELAS`,
		chatbotText: `Olá, [NOMEUM]! Acabooou!! Que demais! Parabéns por ter chegado até aqui, aposto que foi enriquecedor! 

Para que nós saibamos como tornar a experiência ainda melhor para nossas alunas, você pode clicar no link abaixo e dar seu feedback sobre o último módulo?  

[AVALIACAO3]
`,
	},
	warning24h: {
		subject: '[ LEMBRETE ] - Programa ELAS',
		text: '',
		chatbotText: `[NOMEUM], amanhã começa o Módulo [MODULOAVISAR]! Passando para te lembrar 😉
As atividades, estão ok? E a animação, lá em cima?

Local: [LOCAL]
Data: [DATAHORA]

As atividades que devem estar 100% para amanhã são:
[ATIVIDADESCOMPLETAS]

Nós estamos ansiosas para te ver, até lá!!
`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
	warning1h: {
		subject: '[ LEMBRETE ] - Programa ELAS',
		text: '',
		chatbotText: `Ludmila mandou dizer que é hooooje!! Bora se animar para mais um dia ELAAAAS? 

Te esperamos hein!! 
https://www.youtube.com/watch?v=y6Sxv-sUYtM

`,
		chatbotButton: [
			{ content_type: 'text', title: 'Ok', payload: 'mainMenu' },
		],
	},
};

const result = [];
Object.keys(notifications).forEach(async (key) => {
	const element = notifications[key];
	const aux = {};

	aux.name = key;
	aux.created_at = new Date();
	aux.updated_at = new Date();
	if (element.subject) { aux.email_subject = element.subject; }
	if (element.text) { aux.email_text = element.text; }
	if (element.chatbotText) { aux.chatbot_text = element.chatbotText; }
	if (element.chatbotButton) { aux.chatbot_quick_reply = JSON.stringify(element.chatbotButton); }
	if (element.chatbotCard) { aux.chatbot_cards = JSON.stringify(element.chatbotCard); }
	if (element.anexo) { aux.attachment_name = element.anexo; }
	if (element.anexoLink) { aux.attachment_link = element.anexoLink; }
	result.push(aux);
});

module.exports = {
	up(queryInterface, Sequelize) { // eslint-disable-line
		return queryInterface.bulkInsert('notification_types', result);
	},

	down(queryInterface, Sequelize) {
		return queryInterface.bulkDelete(
			'notification_types',
			{ id: { [Sequelize.Op.gte]: 1 } }, {},
		);
	},
};
