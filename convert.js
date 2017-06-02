#!/usr/bin/node

const fileSystem = require('fs');
const async = require('async');
const parseCsv = require('csv-parse');

/**
 * Parses "UTC +5" to 300. Returns undefined if the passed input could not be parsed.
 */
const parseTimeZoneValue = (function parseTimeZoneValueUnbound(matcher, input) {
	const matches = matcher.exec(input);
	if (null === matches) {
		return undefined;
	}
	var result = parseInt(matches[2], 10) * 60;
	if (undefined !== matches[3]) {
		result += parseInt(matches[3]);
	}
	if ('-' == matches[1]) {
		result = -result;
	}
	return result;
}).bind(undefined, /^UTC (\+|-)([01]?\d)(?::([0-5]\d))?$/);

function trimName(name) {
	const lineBreakIndex = name.indexOf('\n');
	if (-1 == lineBreakIndex) {
		return name.trim();
	} else /* if (-1 != lineBreakIndex) */ {
		return name.substr(0, lineBreakIndex).trim();
	}
}

async.waterfall([
	fileSystem.readFile.bind(fileSystem, 'source/data.csv', {encoding: 'utf8'}),
	parseCsv,
	function shiftOffHeader(input, callback) {
		input.shift();
		callback(null, input);
	},
	function removeMiletaryTimeZones(input, callback) {
		callback(
			null,
			input.filter(([abbreviation, name, category, value]) => {
				return 'Military' != category;
			})
		);
	},
	function composeResult(input, callback) {
		const result = {};
		input.forEach(([abbreviation, name, category, value]) => {
			const parsedValue = parseTimeZoneValue(value);
			if (undefined === parsedValue) {
				console.log(['Dropping \"', trimName(name), '\" because the value could not be parsed: ', value].join(''));
				return;
			}
			if (undefined !== result[abbreviation]) {
				console.log(['Dropping \"', trimName(name), '\" because this abbreviation was already set: ', abbreviation].join(''));
				return;
			}
			result[abbreviation] = parsedValue;
		});
		callback(null, result);
	},
	function convertToJson(input, callback) {
		callback(null, JSON.stringify(input));
	},
	function writeResult(input, callback) {
		fileSystem.writeFile('data.json', input, {encoding: 'utf8'}, callback);
	}
], error => {
	if (null !== error) {
		process.stderr.write(
			[
				'An error occurred',
				error.message,,,
			].join('\n'),
			'utf-8'
		);
	}
});
