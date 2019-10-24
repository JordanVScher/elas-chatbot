const limitMonths = process.env.PESQUISA_MONTHS ? parseInt(process.env.PESQUISA_MONTHS, 10) : 0;

const pesquisaLinksObj = {
	1: 'foobar1',
	2: 'foobar2',
	3: 'foobar3',
	4: 'foobar4',
};

/**
 * add new link thats about to be sent to the original links array
 * @param {object} links - links_enviados from aluno_pesquisa
 * @param {string} newLink - new link to add
 * @return {object} links obj with newLink at the first empty key
 */
async function updateLinksObj(links, newLink) {
	const result = links;
	let flag = false;

	Object.keys(result).forEach((e) => {
		if (!flag && !result[e]) {
			result[e] = newLink;
			flag = true;
		}
	});

	return result;
}

module.exports = { limitMonths, pesquisaLinksObj, updateLinksObj };
