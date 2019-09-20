/* global _ Backbone toQueryString BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	attributes: { 'data-view': 'LoginButtonView' },

	initialize(options = {}) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	loginFragment: 'login',
	logoutFragment: 'logout',

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		if (Backbone.History.started) {
			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const loginFragment = _.result(this, 'loginFragment');
			if (currentFragment !== loginFragment) {
				const docFragment = document.createDocumentFragment();

				if (this.model.isLoggedIn()) {
					const link = docFragment.appendChild(document.createElement('a'));
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
					const link = docFragment.appendChild(document.createElement('a'));
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
				this.el.appendChild(docFragment);
			}
		}

		return BaseView.prototype.render.call(this);
	}
});
