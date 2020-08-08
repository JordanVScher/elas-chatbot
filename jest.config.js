module.exports = {
	verbose: true,
	testURL: 'http://localhost/',
	testPathIgnorePatterns: [
		'./__tests__/context.js',
		'./__tests__/mock_data.js',
	],
	globals: {
		TEST: true,
	},
};
