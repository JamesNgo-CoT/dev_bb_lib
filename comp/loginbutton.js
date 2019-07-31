/* global _ AppEssentials Backbone */

AppEssentials.Backbone.Components.LoginButtonView = AppEssentials.Backbone.View.extend({

	// Overriden Property

	events: {
		['click button']() {
			this.afterRenderOnce = () => {
				this.el.querySelector('a').focus();
			};
			AppEssentials.Backbone.LoginModel.instance.logout();
		}
	},

	// New Property

	loginFragment: 'login',

	// Overriden Methods

	initialize(options) {
		if (AppEssentials.Backbone.LoginModel.instance) {
			this.listenTo(AppEssentials.Backbone.LoginModel.instance, 'change', () => {
				this.render();
			});
		}

		AppEssentials.Backbone.View.prototype.initialize.call(this, options);
	},

	render() {
		if (AppEssentials.Backbone.LoginModel.instance) {
			if (AppEssentials.Backbone.LoginModel.instance.isLoggedIn()) {
				const cotUser = AppEssentials.Backbone.LoginModel.instance.get('cotUser');
				const name = cotUser ? [cotUser.lastName, cotUser.firstName].filter(str => str).join(', ') : AppEssentials.Backbone.LoginModel.instance.get('userID');
				this.el.innerHTML = `<button type="button" class="btn btn-default">Logout: <strong>${name}</strong></button>`;
			} else {
				const fullLoginFragment = _.result(this, 'fullLoginFragment');
				this.el.innerHTML = `<a href="#${fullLoginFragment}" class="btn btn-default">Login</a>`;
			}
		} else {
			this.el.innerHTML = '';
		}

		return AppEssentials.Backbone.View.prototype.render.call(this);
	},

	// New Methods

	fullLoginFragment() {
		const loginFragment = _.result(this, 'loginFragment');
		const query = Backbone.History.started ? `?${AppEssentials.Utilities.toQueryString({ redirect: Backbone.history.getFragment() })}` : '';
		return `${loginFragment}${query}`;
	},

	hide() {
		this.el.classList.add('hide');
	},

	show() {
		this.el.classList.remove('hide');
	}
});
