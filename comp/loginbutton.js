/* global _ AppEssentials Backbone */

AppEssentials.Backbone.Components.LoginButtonView = AppEssentials.Backbone.View.extend({

	// Overriden Property

	events: {
		['click button']() {
			this.afterRenderOnce = () => {
				this.el.querySelector('a').focus();
			};
			AppEssentials.Backbone.Common.loginModel.logout();
		}
	},

	// New Property

	loginFragment: 'login',

	// Overriden Methods

	initialize(options) {
		const loginModel = AppEssentials.Backbone.Common.loginModel;
		this.listenTo(loginModel, 'change', () => {
			this.render();
		});

		AppEssentials.Backbone.View.prototype.initialize.call(this, options);
	},

	render() {
		const loginModel = AppEssentials.Backbone.Common.loginModel;
		if (loginModel.isLoggedIn()) {
			const cotUser = loginModel.get('cotUser');
			const name = cotUser ? [cotUser.lastName, cotUser.firstName].filter(str => str).join(', ') : loginModel.get('userID');
			this.el.innerHTML = `<button type="button" class="btn btn-default">Logout: <strong>${name}</strong></button>`;
		} else {
			const fullLoginFragment = _.result(this, 'fullLoginFragment');
			this.el.innerHTML = `<a href="#${fullLoginFragment}" class="btn btn-default">Login</a>`;
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
