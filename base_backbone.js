/* global _ Backbone */

Backbone.sync = (originalBackboneSync =>
	function(method, model, options = {}) {
		options = Object.assign({}, options);

		options.headers = Object.assign({}, options.headers);
		options.headers.Accept = options.headers.Accept || 'application/json; charset=utf-8';

		if (!options.headers.Authorization && !(model instanceof LoginModel)) {
			const loginModel = new LoginModel();
			if (!loginModel.isLoggedIn()) {
				options.headers.Authorization = `AuthSession ${loginModel.get(loginModel.idAttribute)}`;
			}
		}

		if (method === 'create' || method === 'update' || method === 'patch') {
			options.contentType = options.contentType || 'application/json; charset=utf-8';

			if (!options.data) {
				let json = options.attrs ? Object.assign({}, options.attrs) : model.toJSON(options);

				delete json['@odata.context'];
				delete json['@odata.etag'];
				delete json['__CreatedOn'];
				delete json['__ModifiedOn'];
				delete json['__Owner'];

				const adjustSyncJson = options.adjustSyncJson || model.adjustSyncJson || ((value) => value);
				json = adjustSyncJson.call(model, json);

				options.data = JSON.stringify(json);
			}
		}

		return new Promise((resolve, reject) => {
			originalBackboneSync
				.call(this, method, model, options)
				.then(
					(data, textStatus, jqXHR) => resolve({ data, textStatus, jqXHR }),
					(jqXHR, textStatus, errorThrown) => reject({ jqXHR, textStatus, errorThrown })
				);
		});
	})(Backbone.sync);

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

		if (typeof oldCallback === 'function' && oldCallback !== this.routeDefault) {
			const newCallback = function(...args) {
				this.lastFragment = Backbone.history.getFragment();
				return oldCallback.call(this, ...args);
			};

			if (typeof callback === 'function') {
				callback = newCallback;
			} else if (typeof name === 'function') {
				name = newCallback;
			} else if (typeof name === 'string' && typeof this[name] === 'function') {
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

		if (cleanupFunctionReturnValue !== false && typeof callback === 'function') {
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
		const base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');
		if (this.isNew()) {
			return base;
		}

		const id = this.get(this.idAttribute);
		return `${base.replace(/\/$/, '')}('${encodeURIComponent(id)}')`;
	},

	setSnapShot() {
		this.snapShotData = JSON.stringify(this.toJSON());
		return this;
	},
	hasChanged() {
		return this.snapShotData != JSON.stringify(this.toJSON());
	},
	sync(method, model, options) {
		return Backbone.Model.prototype.sync.call(this, method, model, options).then(returnValue => {
			this.setSnapShot();
			return returnValue;
		});
	},

	webStorage: localStorage,
	webStorageFetch(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage') || _.result(BaseModel, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey') || _.result(BaseModel, 'webStorageKey');

		if (webStorage && webStorageKey) {
			this.set(JSON.parse(webStorage.getItem(webStorageKey)), options);
		}
	},
	webStorageSave(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage') || _.result(BaseModel, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey') || _.result(BaseModel, 'webStorageKey');

		if (webStorage && webStorageKey) {
			webStorage.setItem(webStorageKey, JSON.stringify(this.toJSON(options)));
		}
	},
	webStorageDestroy(options) {
		const webStorage =
			_.result(options, 'webStorage') || _.result(this, 'webStorage') || _.result(BaseModel, 'webStorage');
		const webStorageKey =
			_.result(options, 'webStorageKey') || _.result(this, 'webStorageKey') || _.result(BaseModel, 'webStorageKey');

		if (webStorage && webStorageKey) {
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
		return Backbone.Collection.prototype.sync.call(this, method, model, options).then(returnValue => {
			this.snapShotData = JSON.stringify(model.toJSON());
			return returnValue;
		});
	},

	hasChanged() {
		return this.snapShotData != JSON.stringify(this.toJSON());
	},

	webStorage: BaseModel.prototype.webStorage,
	webStorageFetch: BaseModel.prototype.webStorageFetch,
	webStorageSave: BaseModel.prototype.webStorageSave,
	webStorageDestroy: BaseModel.prototype.webStorageDestroy
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

	save(attributes = {}, options = {}) {
		const { app = _.result(this, 'app'), user = this.get('user'), pwd = this.get('pwd') } = attributes;

		return BaseModel.prototype.save.call(this, { app, user, pwd }, options);
	},

	parse(response, options) {
		delete response.pwd;
		this.clear({ silent: true });
		return BaseModel.prototype.parse.call(this, response, options);
	},

	destroy(options = {}) {
		options.headers = options.headers || {};
		options.headers.Authorization = this.get('userID');
		return BaseModel.prototype.destroy.call(this, options).then(() => this.clear(), () => this.clear());
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
		return Promise.resolve().then(() => {
			if (!this.isLoggedIn()) {
				return false;
			} else {
				if (
					options.ignoreLastAuthentication !== true &&
					this.lastAuthentication &&
					Math.abs((new Date().getTime() - this.lastAuthentication.getTime()) / 1000 / 60 / 60) < 5
				) {
					return this.isLoggedIn();
				}

				return this.fetch(options).then(
					() => {
						this.lastAuthentication = new Date();
						return this.isLoggedIn();
					},
					() => {
						this.clear();
						this.isLoggedIn();
					}
				);
			}
		});
	},

	webStorageSave(options) {
		this.unset('pwd', { silent: true });
		return BaseModel.prototype.webStorageSave.call(this, options);
	}
});
