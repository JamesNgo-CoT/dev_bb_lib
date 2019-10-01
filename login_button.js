/* global htm _ Backbone toQueryString BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	initialize(options = {}) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	// PROPERTIES

	attributes: {
		'data-view': 'LoginButtonView'
	},

	loginFragment: 'login',
	logoutFragment: 'logout',

	// METHOD

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		const renderPromises = [];

		if (Backbone.History.started) {
			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const loginFragment = _.result(this, 'loginFragment');

			if (currentFragment !== loginFragment) {
				const docFragment = document.createDocumentFragment();

				if (this.model.isLoggedIn()) {
					const logoutFragment = _.result(this, 'logoutFragment');
					const query = toQueryString({
						redirect: Backbone.history.getFragment()
					});

					const cotUser = this.model.get('cotUser');
					const name = cotUser
						? [cotUser.lastName, cotUser.firstName].filter(value => value).join(', ')
						: this.model.get('userID');

					renderPromises.push(
						docFragment.appendChild(
							htm.a({ 'class': 'btn btn-default btn-logout', 'href': `#${logoutFragment}?${query}` }, [
								`Logout: <strong>${name}</strong>`
							], [])
						).promise
					);
				} else {
					const logoutFragment = _.result(this, 'logoutFragment');
					let query;
					if (currentFragment === logoutFragment) {
						query = Backbone.history.getFragment().split('?')[1] || '';
					} else {
						query = toQueryString({
							redirect: Backbone.history.getFragment()
						});
					}

					renderPromises.push(
						docFragment.appendChild(
							htm.a({ 'class': 'btn btn-default btn-login', 'href': `#${loginFragment}?${query}` }, [
								'Login'
							], [])
						).promise
					);
				}

				this.el.appendChild(docFragment);
			}
		}

		return Promise.all(renderPromises).then(() => BaseView.prototype.render.call(this));
	}
});
