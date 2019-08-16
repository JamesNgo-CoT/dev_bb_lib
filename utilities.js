/* global $ */

$.ajaxSetup({
	dataFilter(data) {
		return data;
	}
});

/* exported doAjax */
function doAjax(options) {
	return new Promise((resolve, reject) => {
		$.ajax(options).then(
			(data, textStatus, jqXHR) => resolve({ data, textStatus, jqXHR }),
			(jqXHR, textStatus, errorThrown) => reject({ jqXHR, textStatus, errorThrown })
		);
	});
}

/* exported escapeODataValue */
function escapeODataValue(value) {
	return value
		.replace(/'/g, "''")
		.replace(/%/g, '%25')
		.replace(/\+/g, '%2B')
		.replace(/\//g, '%2F')
		.replace(/\?/g, '%3F')
		.replace(/#/g, '%23')
		.replace(/&/g, '%26')
		.replace(/\[/g, '%5B')
		.replace(/\]/g, '%5D')
		.replace(/\s/g, '%20');
}

/* exported loadScripts */
function loadScripts(...urls) {
	return Promise.all(
		urls.map(url => {
			if (document.querySelectorAll(`script[src="${url}"]`).length > 0) {
				return;
			}

			return new Promise((resolve, reject) => {
				var script = document.createElement('script');
				script.setAttribute('src', url);
				script.onerror = () => reject();
				script.onload = () => resolve();
				script.onreadystatechange = () => resolve();
				document.getElementsByTagName('head')[0].appendChild(script);
			});
		})
	);
}

/* exported stringToFunction */
function stringToFunction(str) {
	if (typeof str !== 'string') {
		return str;
	}

	if (str.indexOf('function(') === 0) {
		return Function(`return ${str}`)();
	} else if (typeof window[str] === 'function') {
		return window[str];
	}

	return null;
}

/* exported toQueryObject */
function toQueryObject(queryString) {
	if (typeof queryString !== 'string') {
		return queryString;
	}

	if (queryString.indexOf(',') !== -1) {
		return queryString.split(',').map(value => toQueryObject(value));
	}

	if (queryString.indexOf('=') !== -1) {
		return queryString.split('&').reduce((acc, curr) => {
			const [name, value] = curr.split('=');
			acc[name] = toQueryObject(value);
			return acc;
		}, {});
	}

	const prefix = queryString.charAt(0);
	let value = decodeURIComponent(queryString.slice(1));
	switch (prefix) {
		case 'u':
			value = undefined;
			break;
		case 'b':
			value = Boolean(value);
			break;
		case 'n':
			value = Number(value);
			break;
		case 'f':
			value = new Function(`return ${value}`)();
			break;
		case 'o':
			value = null;
			break;
	}
	return value;
}

/* exported toQueryString */
function toQueryString(queryObject) {
	if (Array.isArray(queryObject)) {
		return queryObject.map(value => toQueryString(value)).join(',');
	}

	if (typeof queryObject === 'object' && queryObject !== null) {
		return Object.keys(queryObject)
			.filter(key => Object.prototype.hasOwnProperty.call(queryObject, key))
			.map(key => `${key}=${toQueryString(queryObject[key])}`)
			.join('&');
	}

	let prefix = '';
	switch (typeof queryObject) {
		case 'undefined':
			prefix = 'u';
			break;
		case 'boolean':
			prefix = 'b';
			break;
		case 'number':
			prefix = 'n';
			break;
		case 'function':
			prefix = 'f';
			break;
		case 'object':
			prefix = 'o';
			break;
		default:
			prefix = 's';
	}

	return encodeURIComponent(`${prefix}${String(queryObject)}`);
}
