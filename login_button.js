/* global _ Backbone toQueryString BaseView */

/* exported LoginButtonView */
const LoginButtonView = BaseView.extend({
	attributes: { 'data-view': 'LoginButtonView' },

	events: {
		['click .btn-logout'](event) {
			event.preventDefault();

			const fragment = _.result(this, 'logoutFragment');
			const query = toQueryString({
				redirect: Backbone.history.getFragment()
			});

			console.log(`${fragment}?${query}`);

			Backbone.history.navigate(`${fragment}?${query}`, { trigger: true });
		},

		['click .btn-login'](event) {
			event.preventDefault();

			const fragment = _.result(this, 'loginFragment');

			const currentFragment = Backbone.history.getFragment().split('?')[0];
			const logoutFragment = _.result(this, 'logoutFragment');

			let query;
			if (currentFragment === logoutFragment) {
				query = Backbone.history.getFragment().split('?')[1] || '';
			} else {
				query = toQueryString({
					redirect: Backbone.history.getFragment()
				});
			}

			Backbone.history.navigate(`${fragment}?${query}`, { trigger: true });
		}
	},

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

				const btn = fragment.appendChild(document.createElement('button'));
				btn.setAttribute('type', 'button');
				btn.classList.add('btn', 'btn-default');

				if (this.model.isLoggedIn()) {
					btn.classList.add('btn', 'btn-logout');

					const cotUser = this.model.get('cotUser');
					const name = cotUser
						? [cotUser.lastName, cotUser.firstName].filter(value => value).join(', ')
						: this.model.get('userID');
					btn.innerHTML = `Logout: <strong>${name}</strong>`;
				} else {
					btn.classList.add('btn', 'btn-login');
					btn.innerHTML = 'Login';
				}

				this.el.appendChild(fragment);
			}
		}

		return BaseView.prototype.render.call(this);
	}
});
