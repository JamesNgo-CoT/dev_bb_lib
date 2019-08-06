/* global _ toQueryString Backbone BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	attributes: { 'data-view': 'LoginButtonView' },

	loginFragment: null,
	logoutFragment: null,

	initialize(options = {}) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});
		BaseView.prototype.initialize.call(this, options);
	},

	render() {
		if (!Backbone.History.started) {
			this.el.innerHTML = '';
		} else {
			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const loginFragment = _.result(this, 'loginFragment');
			if (currentFragment === loginFragment) {
				this.el.innerHTML = '';
			} else {
				if (this.model.isLoggedIn()) {
					const cotUser = this.model.get('cotUser');
					const name = cotUser
						? [cotUser.lastName, cotUser.firstName].filter(value => value).join(', ')
						: this.model.get('userID');
					this.el.innerHTML = `<a href="#${this.completeLogoutFragment()}" class="btn btn-default btn-logout">Logout: <strong>${name}</strong></a>`;
				} else {
					this.el.innerHTML = `<a href="#${this.completeLoginFragment()}" class="btn btn-default btn-login">Login</a>`;
				}
			}
		}

		return BaseView.prototype.render.call(this);
	},

	completeLoginFragment() {
		const currentFragment = Backbone.history.getFragment().split('?')[0];
		const loginFragment = _.result(this, 'loginFragment');
		const logoutFragment = _.result(this, 'logoutFragment');

		let query;
		if (currentFragment === logoutFragment) {
			query = Backbone.history.getFragment().split('?')[1] || '';
		} else {
			query = toQueryString({
				redirect: Backbone.history.getFragment()
			});
		}

		return `${loginFragment}?${query}`;
	},

	completeLogoutFragment() {
		const logoutFragment = _.result(this, 'logoutFragment');
		const query = toQueryString({
			redirect: Backbone.history.getFragment()
		});

		return `${logoutFragment}?${query}`;
	}
});
