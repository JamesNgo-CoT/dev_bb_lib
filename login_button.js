/* global _ toQueryString Backbone BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	attributes: { 'data-view': 'LoginButtonView' },

	events: {
		['click .btn-login'](event) {
			event.preventDefault();

			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const loginFragment = _.result(this, 'loginFragment');
			const logoutFragment = _.result(this, 'logoutFragment');

			let query;
			if (currentFragment === logoutFragment) {
				query = Backbone.history.getFragment().split('?')[1] || '';
			} else {
				query = toQueryString({ redirect: Backbone.history.getFragment() });
			}

			Backbone.history.navigate(`${loginFragment}?${query}`, { trigger: true });
		},

		['click .btn-logout'](event) {
			event.preventDefault();

			const promiseFinally = () => {
				const logoutFragment = _.result(this, 'logoutFragment');
				const query = toQueryString({ redirect: Backbone.history.getFragment() });
				Backbone.history.navigate(`${logoutFragment}?${query}`, { trigger: true });
			};

			this.loginModel.logout().then(promiseFinally, promiseFinally);
		}
	},

	initialize(options = {}) {
		this.listenTo(this.loginModel, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		if (Backbone.History.started) {
			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const loginFragment = _.result(this, 'loginFragment');
			if (currentFragment !== loginFragment) {
				if (this.loginModel.isLoggedIn()) {
					const cotUser = this.loginModel.get('cotUser');
					const name = cotUser
						? [cotUser.lastName, cotUser.firstName].filter(value => value).join(', ')
						: this.loginModel.get('userID');
					this.el.innerHTML = `<button type="button" class="btn btn-default btn-logout">Logout: <strong>${name}</strong></button>`;
				} else {
					this.el.innerHTML = '<button type="button" class="btn btn-default btn-login">Login</button>';
				}
			}
		}

		return BaseView.prototype.render.call(this);
	}
});
