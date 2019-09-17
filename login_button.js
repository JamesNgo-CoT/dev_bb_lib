/* global _ Backbone toQueryString BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	attributes: { 'data-view': 'LoginButtonView' },

	loginFragment: 'login',
	logoutFragment: 'logout',

	initialize(options = {}) {
		this.listenTo(this.model, 'change', () => {
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
				const fragment = document.createDocumentFragment();

				if (this.model.isLoggedIn()) {
					const link = fragment.appendChild(document.createElement('a'));
					link.classList.add('btn', 'btn-default', 'btn-logout');

					const logoutFragment = _.result(this, 'logoutFragment');
					const query = toQueryString({
						redirect: Backbone.history.getFragment()
					});
					link.setAttribute('href', `#${logoutFragment}?${query}`);

					const cotUser = this.model.get('cotUser');
					const name = cotUser
						? [cotUser.lastName, cotUser.firstName].filter(value => value).join(', ')
						: this.model.get('userID');
					link.innerHTML = `Logout: <strong>${name}</strong>`;
				} else {
					const link = fragment.appendChild(document.createElement('a'));
					link.classList.add('btn', 'btn-default', 'btn-login');
					link.innerHTML = 'Login';

					const logoutFragment = _.result(this, 'logoutFragment');
					let query;
					if (currentFragment === logoutFragment) {
						query = Backbone.history.getFragment().split('?')[1] || '';
					} else {
						query = toQueryString({
							redirect: Backbone.history.getFragment()
						});
					}
					link.setAttribute('href', `#${loginFragment}?${query}`);
				}
				this.el.appendChild(fragment);
			}
		}

		return BaseView.prototype.render.call(this);
	}
});
