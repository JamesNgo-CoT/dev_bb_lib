Backbone.ajax = ajax;

////////////////////////////////////////////////////////////////////////////////

Backbone.sync = (backboneSync => ((method, model, options = {}) => {
  options.headers = options.headers || {};
  options.headers.Accept = options.headers.Accept || 'application/json; charset=utf-8';

  if (!options.headers.Authorization) {
    const authModel = _.result(model, 'authModel') || _.result(Backbone, 'authModel');
    if (authModel && authModel !== model && !authModel.isNew()) {
      options.headers.Authorization = `AuthSession ${authModel.get(authModel.idAttribute)}`;
    }
  }

  if (method === 'create' || method === 'update' || method === 'patch') {
    options.contentType = options.contentType || 'application/json; charset=utf-8';

    if (!options.data) {
      let json = options.attrs || model.toJSON(options);

      delete json['@odata.context'];
      delete json['@odata.etag'];
      delete json['__CreatedOn'];
      delete json['__ModifiedOn'];
      delete json['__Owner'];

      const adjustSyncJson = options.adjustSyncJson || model.adjustSyncJson;
      if (adjustSyncJson) {
        json = adjustSyncJson(json);
      }

      options.data = JSON.stringify(json);
    }
  }

  return backboneSync.call(this, method, model, options);
}))(Backbone.sync);

////////////////////////////////////////////////////////////////////////////////

Backbone.BaseRouter = Backbone.Router.extend({
  defaultFragment: 'home',

  routes: {
    ['home']() { },
    '*default': 'routeDefault'
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
      const newCallback = function (...args) {
        this.lastFragment = Backbone.history.getFragment();
        return oldCallback.call(this, ...args);
      }

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

    if (typeof callback === 'function' && cleanupFunctionReturnValue !== false) {
      Promise.resolve()
        .then(() => {
          return callback.call(this, ...args);
        })
        .then((cleanupFunction) => {
          if (typeof cleanupFunction === 'function') {
            this.cleanupFunction = cleanupFunction;
          }
        });
    }

    if (cleanupFunctionReturnValue === false) {
      this.routeDefault();
    }
  },

  routeDefault() {
    if (typeof this.lastFragment === 'string') {
      this.navigate(this.lastFragment, { trigger: false, replace: true });
    } else {
      const defaultFragment = _.result(this, 'defaultFragment');
      if (typeof defaultFragment === 'string') {
        this.navigate(defaultFragment, { trigger: true });
      }
    }
  }
});

////////////////////////////////////////////////////////////////////////////////

Backbone.webStorageItems = {
  webStorage: localStorage,

  webStorageSync(method, model, options = {}) {
    const webStorage = _.result(options, 'webStorage') || _.result(model, 'webStorage');
    const webStorageKey = _.result(options, 'webStorageKey') || _.result(model, 'webStorageKey');

    switch (method) {
      case 'read':
        model.set(model.webStorageParse(JSON.parse(webStorage.getItem(webStorageKey))), options);
        break;

      case 'create':
      case 'update':
        webStorage.setItem(webStorageKey, JSON.stringify(options.attrs || model.toJSON(options)));
        break;

      case 'delete':
        webStorage.removeItem(webStorageKey);
        break;
    }
  },

  webStorageParse(json, options) {
    return json;
  },

  webStorageFetch(options) {
    this.webStorageSync('read', this, options);
  },

  webStorageSave(attributes, options) {
    if (attributes && !options.attrs) {
      options.attrs = attributes;
    }

    if (this.isNew()) {
      this.webStorageSync('create', this, options);
    } else {
      this.webStorageSync('update', this, options);
    }
  },

  webStorageDestroy(options) {
    this.webStorageSync('delete', this, options);
  }
}

////////////////////////////////////////////////////////////////////////////////

Backbone.BaseModel = Backbone.Model.extend({
  url() {
    if (this.isNew()) {
      const url = Backbone.Model.prototype.url;
      return typeof url === 'function' ? url.call(this) : url;
    }

    const base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');
    const id = this.get(this.idAttribute);
    return `${base.replace(/\/$/, '')}('${encodeURIComponent(id)}')`;
  },

  webStorage: Backbone.webStorageItems.webStorage,
  webStorageSync: Backbone.webStorageItems.webStorageSync,
  webStorageParse: Backbone.webStorageItems.webStorageParse,
  webStorageFetch: Backbone.webStorageItems.webStorageFetch,
  webStorageSave: Backbone.webStorageItems.webStorageSave,
  webStorageDestroy: Backbone.webStorageItems.webStorageDestroy
});

////////////////////////////////////////////////////////////////////////////////

Backbone.BaseCollection = Backbone.Collection.extend({
  model: Backbone.BaseModel,

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

  webStorage: Backbone.webStorageItems.webStorage,
  webStorageSync: Backbone.webStorageItems.webStorageSync,
  webStorageParse: Backbone.webStorageItems.webStorageParse,
  webStorageFetch: Backbone.webStorageItems.webStorageFetch,
  webStorageSave: Backbone.webStorageItems.webStorageSave,
  webStorageDestroy: Backbone.webStorageItems.webStorageDestroy
});

////////////////////////////////////////////////////////////////////////////////

Backbone.BaseView = Backbone.View.extend({
  render() {
    let linkButton = this.el.querySelector('a.btn:not([role="button"])');
    while (linkButton) {
      linkButton.setAttribute('role', 'button');
      linkButton.addEventListener('keydown', function (event) {
        if (event.which === 32) {
          event.preventDefault();
          event.target.click();
        }
      });
      linkButton = this.el.querySelector('a.btn:not([role="button"])');
    }

    return Promise.resolve();
  }
});

////////////////////////////////////////////////////////////////////////////////

Backbone.AuthModel = Backbone.BaseModel.extend({
  idAttribute: 'sid',
  app: 'cotapp',

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
      this.fetch()
        .catch(() => {
          this.clear();
        });
    }

    Backbone.BaseModel.prototype.initialize.call(this, attributes, options);
  },

  parse(response, options) {
    this.clear({ silent: true });

    delete response['@odata.context'];
    delete response.pwd;

    return Backbone.BaseModel.prototype.parse.call(this, response, options);
  },

  save(attributes = {}, options = {}) {
    const { app = _.result(this, 'app'), user = this.get('user'), pwd = this.get('pwd') } = attributes;
    this.clear({ silent: true });
    return Backbone.BaseModel.prototype.save.call(this, { app, user, pwd }, options);
  },

  destroy(options = {}) {
    options.headers = options.headers || {};
    options.headers.Authorization = this.get('userID');
    return Backbone.BaseModel.prototype.destroy.call(this, options)
      .finally(() => this.clear());
  },

  login(options) {
    return this.save(options);
  },

  logout() {
    return this.destroy();
  },

  isLoggedIn() {
    return !this.isNew();
  },

  authentication(options) {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn()) {
        resolve(false);
      } else {
        this.fetch(options)
          .then(() => {
            resolve(this.isLoggedIn());
          }, (error) => {
            reject(error);
          });
      }
    });
  }
});

////////////////////////////////////////////////////////////////////////////////

Backbone.authModel = null;
