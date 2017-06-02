const path = require('path');

module.exports = JSON.parse(
	require('fs').readFileSync(
		path.resolve(path.join(__dirname, 'data.json')),
		{encoding: 'utf8'}
	)
);
