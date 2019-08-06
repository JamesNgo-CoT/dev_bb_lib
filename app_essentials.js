/* global _ $ Backbone */

////////////////////////////////////////////////////////////////////////////////
// UTILITIES
////////////////////////////////////////////////////////////////////////////////

/* exported doAjax */
function doAjax(options) {
	return new Promise((resolve, reject) => {
		$.ajax(options).then(
			(data, textStatus, jqXHR) => resolve({ data, textStatus, jqXHR }),
			(jqXHR, textStatus, errorThrown) =>
				reject({ jqXHR, textStatus, errorThrown })
		);
	});
}

/* exported escapeOdataValue */
function escapeOdataValue(value) {
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
	const promises = [];
	urls.forEach(url => {
		if (document.querySelectorAll(`script[src="${url}"]`).length > 0) {
			return;
		}

		promises.push(
			new Promise(resolve => {
				var script = document.createElement('script');
				script.setAttribute('src', url);

				script.onload = () => {
					resolve();
				};
				script.onreadystatechange = () => {
					resolve();
				};

				document.getElementsByTagName('head')[0].appendChild(script);
			})
		);
	});

	return Promise.all(promises);
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

/* exported restartRouter */
function restartRouter() {
	if (Backbone.History.started) {
		Backbone.history.stop();
	}
	Backbone.history.start();
}

/* exported toQueryString */
function toQueryString(queryObject) {
	if (Array.isArray(queryObject)) {
		return queryObject
			.map(val => {
				return toQueryString(val);
			})
			.join(',');
	}

	if (typeof queryObject === 'object' && queryObject !== null) {
		return Object.keys(queryObject)
			.filter(key => {
				return Object.prototype.hasOwnProperty.call(queryObject, key);
			})
			.map(key => {
				return `${key}=${toQueryString(queryObject[key])}`;
			})
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

/* exported toQueryObject */
function toQueryObject(queryString) {
	if (typeof queryString !== 'string') {
		return queryString;
	}

	if (queryString.indexOf(',') !== -1) {
		return queryString.split(',').map(val => {
			return toQueryObject(val);
		});
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

////////////////////////////////////////////////////////////////////////////////
// JQUERY SETUP
////////////////////////////////////////////////////////////////////////////////

$.ajaxSetup({
	dataFilter(data) {
		return data;
	}
});

////////////////////////////////////////////////////////////////////////////////
// COREJS SETUP
////////////////////////////////////////////////////////////////////////////////

if (window.cot_app) {
	const originalRender = window.cot_app.prototype.render;
	window.cot_app.prototype.render = function() {
		this.titleElement = document
			.querySelector('#app-header h1')
			.appendChild(document.createElement('span'));
		this.titleElement.setAttribute('tabindex', '-1');

		return originalRender.call(this);
	};

	window.cot_app.prototype.setTitle = function(title, subTitle) {
		if (this.titleElement == null) {
			return;
		}

		this.titleElement.innerHTML = title;

		let documentTitles = [this.name];
		if (documentTitles.indexOf(title) === -1) {
			documentTitles.unshift(title);
		}
		if (subTitle != null) {
			documentTitles.unshift(subTitle);
		}
		document.title = documentTitles.filter(title => title).join(' - ');
	};
}

if (window.cot_form) {
	const originalAddformfield = window.cot_form.prototype.addformfield;
	window.cot_form.prototype.addformfield = function(
		fieldDefinition,
		fieldContainer
	) {
		originalAddformfield.call(this, fieldDefinition, fieldContainer);

		if (fieldDefinition['readOnly'] === true) {
			switch (fieldDefinition['type']) {
				case 'email':
				case 'number':
				case 'password':
				case 'text':
					fieldContainer
						.querySelector(`[type="${fieldDefinition['type']}"]`)
						.setAttribute('readonly', '');
					break;

				case 'phone':
					fieldContainer
						.querySelector('[type="tel"]')
						.setAttribute('readonly', '');
					break;

				case 'textarea':
					fieldContainer
						.querySelector('textarea')
						.setAttribute('readonly', '');
					break;
			}
		}
	};

	const originalValidatorOptions = window.cot_form.prototype.validatorOptions;
	window.cot_form.prototype.validatorOptions = function(fieldDefinition) {
		const returnValue = originalValidatorOptions.call(this, fieldDefinition);

		if (fieldDefinition['excluded'] != null) {
			returnValue['excluded'] = fieldDefinition['excluded'];
		}

		return returnValue;
	};
}

if (window.CotForm) {
	const originalRender = window.CotForm.prototype.render;
	window.CotForm.prototype.render = function(...args) {
		function renderLoop({
			definition,
			renderSection,
			renderRow,
			renderField
		}) {
			const renderPromises = [];

			const sections = definition.sections;
			sections.forEach(section => {
				renderPromises.push(renderSection({ definition, section }));

				const rows = section.rows;
				rows.forEach(row => {
					renderPromises.push(renderRow({ definition, section, row }));

					const fields = row.fields;
					if (fields) {
						fields.forEach(field => {
							renderPromises.push(
								renderField({ definition, section, row, field })
							);
						});
					}

					const grid = row.grid;
					if (grid) {
						const fields = grid.fields;
						fields.forEach(field => {
							renderPromises.push(
								renderField({ definition, section, row, field, grid })
							);
						});
					}

					const repeatControl = row.repeatControl;
					if (repeatControl) {
						const repeatControlRows = repeatControl.rows;
						repeatControlRows.forEach(repeatControlRow => {
							const fields = repeatControlRow.fields;
							fields.forEach(field => {
								renderPromises.push(
									renderField({
										definition,
										section,
										row,
										field,
										repeatControl,
										repeatControlRow
									})
								);
							});
						});
					}
				});
			});

			return Promise.all(renderPromises);
		}

		function finalizeRenderer(renderer) {
			return stringToFunction(renderer);
		}

		const cotForm = this;
		const model = cotForm.getModel();
		const view = cotForm.getView();

		const definition = this._definition;

		return Promise.resolve()
			.then(() => {
				return renderLoop({
					definition,
					renderSection({ definition, section }) {
						const renderer = finalizeRenderer(section.preRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section
							});
						}
					},
					renderRow({ definition, section, row }) {
						const renderer = finalizeRenderer(row.preRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section,
								row
							});
						}
					},
					renderField({
						definition,
						section,
						row,
						field,
						grid,
						repeatControl,
						repeatControlRow
					}) {
						return Promise.resolve()
							.then(() => {
								if (field.choices) {
									if (!field.originalChoices) {
										if (Array.isArray(field.choices)) {
											field.originalChoices = field.choices.slice(0);
										} else {
											field.originalChoices = field.choices;
										}
									}

									if (Array.isArray(field.originalChoices)) {
										field.choices = field.originalChoices.slice(0);
									} else {
										field.choices = field.originalChoices;
									}

									if (typeof field.choices === 'string') {
										return doAjax({
											url: field.choices
										}).then(data => {
											field.choices = data;
										});
									}
								}
							})
							.then(() => {
								if (field.choicesMap) {
									field.choicesMap = stringToFunction(
										field.choicesMap
									);
									field.choices = field.choicesMap(field.choices);
								}

								if (
									field.type === 'dropdown' &&
									field.choices[0].value !== ''
								) {
									field.choices.unshift({
										text: '- Select -',
										value: ''
									});
								}

								if (field.choices) {
									let value;
									if (field.value != null) {
										value = field.value;
									} else if (
										field.bindTo != null &&
										model &&
										model.has(field.bindTo)
									) {
										value = model.get(field.bindTo);
									}

									if (value != null) {
										const choices = field.choices.map(choice =>
											choice.value != null
												? choice.value
												: choice.text
										);
										if (choices.indexOf(value) === -1) {
											field.choices.unshift({ text: value, value });
										}
									}
								}

								const renderer = finalizeRenderer(field.preRender);
								if (renderer) {
									return renderer.call(this, {
										cotForm,
										model,
										view,
										definition,
										section,
										row,
										field,
										grid,
										repeatControl,
										repeatControlRow
									});
								}
							});
					}
				});
			})
			.then(() => {
				return originalRender.call(this, ...args);
			})
			.then(() => {
				return renderLoop({
					definition,
					renderSection({ definition, section }) {
						const renderer = finalizeRenderer(section.postRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section
							});
						}
					},
					renderRow({ definition, section, row }) {
						const renderer = finalizeRenderer(row.postRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section,
								row
							});
						}
					},
					renderField({
						definition,
						section,
						row,
						field,
						grid,
						repeatControl,
						repeatControlRow
					}) {
						const renderer = finalizeRenderer(field.postRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section,
								row,
								field,
								grid,
								repeatControl,
								repeatControlRow
							});
						}
					}
				});
			});
	};

	window.CotForm.prototype.getModel = function() {
		return this._model;
	};

	window.CotForm.prototype.setView = function(view) {
		this._view = view;
	};

	window.CotForm.prototype.getView = function() {
		return this._view;
	};

	const originalFillFromModel = window.CotForm.prototype._fillFromModel;
	window.CotForm.prototype._fillFromModel = function(model) {
		originalFillFromModel.call(this, model);

		if (this._isRendered) {
			var sections = this._definition['sections'] || [];
			for (
				let sectionIndex = 0, sectionsLength = sections.length;
				sectionIndex < sectionsLength;
				sectionIndex++
			) {
				var rows = sections[sectionIndex].rows;
				for (
					let rowIndex = 0, rowsLength = rows.length;
					rowIndex < rowsLength;
					rowIndex++
				) {
					const row = rows[rowIndex];
					if (row.repeatControl && row.repeatControl.bindTo) {
						const repeatControlCollection = model.get(
							row.repeatControl.bindTo
						);
						let index = 0;
						while (index < repeatControlCollection.models.length) {
							const model = repeatControlCollection.at(index);
							if (
								JSON.stringify(model.toJSON()) === JSON.stringify({})
							) {
								repeatControlCollection.remove(model);
								continue;
							}

							index++;
						}
					}
				}
			}
		}
	};
}

////////////////////////////////////////////////////////////////////////////////
// BACKBONE SETUP
////////////////////////////////////////////////////////////////////////////////

const originalBackboneSync = Backbone.sync;
Backbone.sync = function(method, model, options = {}) {
	return new Promise((resolve, reject) => {
		options.headers = options.headers || {};
		options.headers.Accept =
			options.headers.Accept || 'application/json; charset=utf-8';

		if (!options.headers.Authorization) {
			const loginModel =
				_.result(model, 'loginModel') || LoginModel.instance;
			if (loginModel && loginModel !== model && !loginModel.isNew()) {
				options.headers.Authorization = `AuthSession ${loginModel.get(
					loginModel.idAttribute
				)}`;
			}
		}

		if (method === 'create' || method === 'update' || method === 'patch') {
			options.contentType =
				options.contentType || 'application/json; charset=utf-8';

			if (!options.data) {
				let json = options.attrs || model.toJSON(options);

				delete json['@odata.context'];
				delete json['@odata.etag'];
				delete json['__CreatedOn'];
				delete json['__ModifiedOn'];
				delete json['__Owner'];

				const adjustSyncJson =
					options.adjustSyncJson || model.adjustSyncJson;
				if (adjustSyncJson) {
					json = adjustSyncJson(json);
				}

				options.data = JSON.stringify(json);
			}
		}

		originalBackboneSync.call(this, method, model, options).then(
			(data, textStatus, jqXHR) => {
				resolve({ data, textStatus, jqXHR });
			},
			(jqXHR, textStatus, errorThrown) => {
				reject({ jqXHR, textStatus, errorThrown });
			}
		);
	});
};

////////////////////////////////////////////////////////////////////////////////
// BACKBONE CLASSES
////////////////////////////////////////////////////////////////////////////////

/* exported BaseRouter */
const BaseRouter = Backbone.Router.extend({
	routes: {
		['home']() {},
		'*default': 'routeDefault'
	},

	defaultFragment: 'home',

	routeDefault() {
		if (typeof this.lastFragment === 'string') {
			this.navigate(this.lastFragment, { trigger: false, replace: true });
		} else {
			const defaultFragment = _.result(this, 'defaultFragment');
			if (typeof defaultFragment === 'string') {
				this.navigate(defaultFragment, { trigger: true });
			}
		}
	},

	route(route, name, callback) {
		let oldCallback;
		if (typeof callback === 'function') {
			oldCallback = callback;
		} else if (typeof name === 'function') {
			oldCallback = name;
		} else if (typeof name === 'string' && typeof this[name] === 'function') {
			oldCallback = this[name];
		}

		if (
			typeof oldCallback === 'function' &&
			oldCallback !== this.routeDefault
		) {
			const newCallback = function(...args) {
				this.lastFragment = Backbone.history.getFragment();
				return oldCallback.call(this, ...args);
			};

			if (typeof callback === 'function') {
				callback = newCallback;
			} else if (typeof name === 'function') {
				name = newCallback;
			} else if (
				typeof name === 'string' &&
				typeof this[name] === 'function'
			) {
				this[name] = newCallback;
			}
		}

		return Backbone.Router.prototype.route.call(this, route, name, callback);
	},

	execute(callback, args, name) {
		let cleanupFunctionReturnValue;

		if (typeof this.cleanupFunction === 'function') {
			cleanupFunctionReturnValue = this.cleanupFunction.call(this, name);
			if (cleanupFunctionReturnValue !== false) {
				this.cleanupFunction = null;
			}
		}

		if (
			cleanupFunctionReturnValue !== false &&
			typeof callback === 'function'
		) {
			Promise.resolve()
				.then(() => {
					return callback.call(this, ...args);
				})
				.then(cleanupFunction => {
					if (typeof cleanupFunction === 'function') {
						this.cleanupFunction = cleanupFunction;
					}
				});
		}

		if (cleanupFunctionReturnValue === false) {
			this.routeDefault();
		}
	}
});

/* exported BaseModel */
const BaseModel = Backbone.Model.extend({
	url() {
		if (this.isNew()) {
			const url = Backbone.Model.prototype.url;
			return typeof url === 'function' ? url.call(this) : url;
		}

		const base =
			_.result(this, 'urlRoot') || _.result(this.collection, 'url');
		const id = this.get(this.idAttribute);
		return `${base.replace(/\/$/, '')}('${encodeURIComponent(id)}')`;
	},

	sync(method, model, options) {
		return Backbone.Model.prototype.sync
			.call(this, method, model, options)
			.then(returnValue => {
				this.lastSyncData = JSON.stringify(model.toJSON());
				return returnValue;
			});
	},

	hasChanged() {
		return this.lastSyncData != JSON.stringify(this.toJSON());
	},

	// Web Storage

	webStorage: localStorage,

	webStorageFetch(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			this.set(JSON.parse(webStorage.getItem(webStorageKey)), options);
		}
	},

	webStorageSave(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			console.log('BASE MODEL', 'WEBSTORAGE SAVE');

			webStorage.setItem(
				webStorageKey,
				JSON.stringify(this.toJSON(options))
			);
		}
	},

	webStorageDestroy(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			console.log('BASE MODEL', 'WEBSTORAGE DESTROY');

			webStorage.removeItem(webStorageKey);
		}
	}
});

/* exported BaseCollection */
const BaseCollection = Backbone.Collection.extend({
	model: BaseModel,

	fetch(options) {
		if (options && options.query) {
			options.url = `${_.result(this, 'url')}?${options.query}`;
		}

		return Backbone.Collection.prototype.fetch.call(this, options);
	},

	parse(response, options) {
		if (response && Array.isArray(response.value)) {
			response = response.value;
		}

		return Backbone.Collection.prototype.parse.call(this, response, options);
	},

	sync(method, model, options) {
		return Backbone.Model.prototype.sync
			.call(this, method, model, options)
			.then(returnValue => {
				this.lastSyncData = JSON.stringify(model.toJSON());
				return returnValue;
			});
	},

	hasChanged() {
		return this.lastSyncData != JSON.stringify(this.toJSON());
	},

	// Web Storage

	webStorage: localStorage,

	webStorageFetch(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			this.set(JSON.parse(webStorage.getItem(webStorageKey)), options);
		}
	},

	webStorageSave(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			webStorage.setItem(
				webStorageKey,
				JSON.stringify(this.toJSON(options))
			);
		}
	},

	webStorageDestroy(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey');

		if (webStorage && webStorageKey) {
			webStorage.removeItem(webStorageKey);
		}
	}
});

/* exported BaseView */
const BaseView = Backbone.View.extend({
	render() {
		let linkButton = this.el.querySelector('a.btn:not([role="button"])');
		while (linkButton) {
			linkButton.setAttribute('role', 'button');
			linkButton.addEventListener('keydown', function(event) {
				if (event.which === 32) {
					event.preventDefault();
					event.target.click();
				}
			});
			linkButton = this.el.querySelector('a.btn:not([role="button"])');
		}

		return Promise.resolve();
	},

	appendTo(el) {
		el.appendChild(this.el);
		return this;
	},

	swapWith(nextView) {
		const element = this.el.parentNode;

		element.style.height = getComputedStyle(this.el).height;
		element.style.overflow = 'hidden';

		this.remove();

		return Promise.resolve()
			.then(() => {
				return nextView.appendTo(element).render();
			})
			.then(() => {
				element.style.removeProperty('overflow');
				element.style.removeProperty('height');
			})
			.then(() => {
				return nextView;
			});
	}
});

/* exported LoginModel */
const LoginModel = BaseModel.extend({
	app: 'cotapp',

	idAttribute: 'sid',

	webStorageKey: 'Auth',

	initialize(attributes, options) {
		this.on(`change:${this.idAttribute}`, () => {
			if (!this.isNew()) {
				this.webStorageSave();
			} else {
				this.webStorageDestroy();
			}
		});

		this.webStorageFetch();

		if (!this.isNew()) {
			this.fetch().catch(() => {
				this.clear();
			});
		}

		BaseModel.prototype.initialize.call(this, attributes, options);
	},

	fetch(options) {
		this.lastFetched = new Date();
		return BaseModel.prototype.fetch.call(this, options);
	},

	save(attributes = {}, options = {}) {
		const {
			app = _.result(this, 'app'),
			user = this.get('user'),
			pwd = this.get('pwd')
		} = attributes;

		return BaseModel.prototype.save.call(this, { app, user, pwd }, options);
	},

	parse(response, options) {
		delete response.pwd;
		return BaseModel.prototype.parse.call(this, response, options);
	},

	destroy(options = {}) {
		options.headers = options.headers || {};
		options.headers.Authorization = this.get('userID');
		return BaseModel.prototype.destroy
			.call(this, options)
			.then(() => this.clear(), () => this.clear());
	},

	isLoggedIn() {
		return !this.isNew();
	},

	login(options) {
		return this.save(options);
	},

	logout() {
		return this.destroy();
	},

	authentication(options = {}) {
		console.log('LOGIN MODEL', 'AUTHENTICATION', 'START');

		return Promise.resolve()
			.then(() => {
				if (!this.isLoggedIn()) {
					return false;
				} else {
					console.log('RE FETCH?', options.ignoreLastFetched !== true &&
						this.lastFetched &&
						Math.abs(
							(new Date().getTime() - this.lastFetched.getTime()) /
								1000 /
								60 /
								60
						) < 1, new Date(), this.lastFetched);
					if (
						options.ignoreLastFetched !== true &&
						this.lastFetched &&
						Math.abs(
							(new Date().getTime() - this.lastFetched.getTime()) /
								1000 /
								60 /
								60
						) < 1
					) {
						return this.isLoggedIn();
					}

					return this.fetch(options).then(
						() => this.isLoggedIn(),
						() => {
							this.clear();
							this.isLoggedIn();
						}
					);
				}
			})
			.then(returnValue => {
				console.log('LOGIN MODEL', 'AUTHENTICATION', 'END', returnValue);

				return returnValue;
			});
	},

	webStorageSave(options) {
		console.log('LOGIN MODEL', 'WEBSTORAGE SAVE');

		this.unset('pwd', { silent: true });
		return BaseModel.prototype.webStorageSave.call(this, options);
	}
});
