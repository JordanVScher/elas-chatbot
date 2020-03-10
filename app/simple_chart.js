/* eslint no-param-reassign: 0 */ // --> OFF

// const fs = require('fs');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { createCanvas } = require('canvas');
// const mailer = require('./utils/mailer');

const colors = {
	darkBlue: '#172244',
	darkRed: '#AE193F',
};

const width = 1500;
const height = 1700;
// const heightOneBigGraph = 3000;

const canvas = createCanvas(width, height);
const ctxBar = canvas.getContext('2d');
const gradientStroke = ctxBar.createLinearGradient(400, 0, 1000, 0);
gradientStroke.addColorStop(0, colors.darkRed);
gradientStroke.addColorStop(0.85, colors.darkBlue);

const configuration = {
	type: 'horizontalBar',
	data: {
		labels: '<to_be_filled>',
		datasets: [{
			data: '<to_be_filled>',
			backgroundColor: gradientStroke,
			// label: '', borderWidth: 0, // borderColor: 'rgba(255, 255 ,255, 100)',
		}],
	},
	options: {
		legend: { display: false },
		barRoundness: 1,
		title: {
			display: false,
			text: '',
			fontSize: 22,
			fontFamily: 'Roboto Mono',
			fontStyle: 'initial',
			fontColor: 'black',
		},
		layout: {
			padding: {
				left: 40, right: 100, top: 100, bottom: 80,
			},
		},
		scales: {
			xAxes: [{
				// gridLines: { color: 'rgba(0, 0, 0, 0)' },
				display: false, // removes ticks and line
				ticks: {
					// display: false, // removes only the ticks
					min: '<to_be_filled>',
					// min: Math.min(...Object.values(finalData)) - 15, // max: Math.max(...Object.values(finalData)), // stepSize: 5,
				},
			}],
			yAxes: [{
				gridLines: { color: 'white' },
				ticks: {
					fontSize: 20,
					fontStyle: 'bold',
					fontFamily: 'Helvetica Neue',
					fontColor: 'rgba(0,0,0,100)',
					// callback: value => `${value}`,
				},
			}],
		},
	},

};
const chartCallback = (ChartJS) => {
	// Global config example: https://www.chartjs.org/docs/latest/configuration/
	ChartJS.plugins.register({
		beforeDraw(chartInstance) {
			const { ctx } = chartInstance.chart;
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height); // paint the background white
			// add values at the end of each bar
			ctx.font = ChartJS.helpers.fontString(ChartJS.defaults.global.defaultFontFamily, 'normal', ChartJS.defaults.global.defaultFontFamily);
			ctx.textAlign = 'left'; // ctx.textBaseline = 'bottom';
			chartInstance.data.datasets.forEach((dataset) => {
				for (let i = 0; i < dataset.data.length; i++) {
					ctx.fillStyle = 'black'; // label color
					let positionChange = 8;
					if (dataset.data[i] < 0) {
						positionChange = 45;
					}
					const view = dataset._meta['0'].data[i]._view; // view.x -> end of each bar
					const valueLabel = `${dataset.data[i].toString().replace('.', ',')}%`; // format number to appear as percentage text
					ctx.fillText(valueLabel, view.x + positionChange, view.y + 8);
				}
			});
		},
	});
};

async function buildChart(conf) {
	const canvasRenderService = new CanvasRenderService(width, height, chartCallback);
	const image = await canvasRenderService.renderToBuffer(conf);
	return image;
}

module.exports.createChart = async (labels, data, id, title) => {
	const conf = configuration;

	const finalData = {};
	labels.forEach((element, index) => {
		if (data[index] || data[index].toString() === '0') { finalData[element] = data[index]; }
	});

	conf.data.labels = Object.keys(finalData);
	conf.data.datasets[0].data = Object.values(finalData);
	conf.options.scales.xAxes[0].ticks.min = Math.min(...Object.values(finalData)) - 15;
	if (title) {
		conf.options.title.display = false; // true
		conf.options.title.text = title;
	}

	const result = await buildChart(conf, id);
	return result;
};

// const labels = [
// 	'GERIR CONFLITOS',
// 	'AUTOCONFIANÇA',
// 	'PRODUTIVIDADE',
// 	'COMUNICAÇÃO E INFLUÊNCIA',
// 	'TOMAR DECISÕES COM SEGURANÇA',
// 	'CONTROLAR EMOÇÕES',
// 	'CAPACIDADE DE DIZER NÃO',
// 	'MANTER O FOCO',
// 	'REDUÇÃO DO STRESS',
// 	'SUPERAR BLOQUEIOS',
// ];

// const data = [35.0, 39.5, 40.0, 41.0, 43.0, 43.5, 45.5, 47.5, 48.0, 51.5];

// createChart(labels, data, 'exemplo', 'EVOLUÇÃO POSITIVA DAS HABILIDADES DAS ALUNAS (EM 3 MESES)');
