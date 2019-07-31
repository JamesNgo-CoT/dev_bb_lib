/* global AppEssentials */

AppEssentials.Backbone.Components.NavItemModel = AppEssentials.Backbone.Model.extend({

	// Overriden Property

	defaults: {
		title: 'Untitled',
		fragment: '',
		isActive: false,
		isVisible: true,
		requiresLogin: false
	}
});

AppEssentials.Backbone.Components.NavItemView = AppEssentials.Backbone.View.extend({

	// Overriden Properties

	attributes: { role: 'presentation' },

	tagName: 'li',


	// Overriden Methods

	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		AppEssentials.Backbone.View.prototype.initialize.call(this, options);
	},

	render() {
		this.el.innerHTML = `<a href="#${this.model.escape('fragment')}">${this.model.escape('title')}</a>`;

		if (this.model.get('isActive')) {
			this.el.classList.add('active');
		} else {
			this.el.classList.remove('active');
		}

		if (this.model.get('isVisible')) {
			this.el.classList.remove('hide');
		} else {
			this.el.classList.add('hide');
		}

		return AppEssentials.Backbone.View.prototype.render.call(this);
	}
});

AppEssentials.Backbone.Components.AuthyNavItemView = AppEssentials.Backbone.Components.NavItemView.extend({
	initialize(options) {
		const loginModel = AppEssentials.Shared.loginModel;
		this.listenTo(loginModel, 'change', () => {
			this.render();
		});

		return AppEssentials.Backbone.Components.NavItemView.prototype.initialize.call(this, options);
	},

	render() {
		return AppEssentials.Backbone.Components.NavItemView.prototype.render.call(this)
			.then(() => {
				const loginModel = AppEssentials.Shared.loginModel;
				if (loginModel && loginModel.isLoggedIn()) {
					this.el.classList.remove('hide');
				} else {
					this.el.classList.add('hide');
				}
			});
	}
});

AppEssentials.Backbone.Components.NavCollection = AppEssentials.Backbone.Collection.extend({

	// Override Property

	model: AppEssentials.Backbone.Components.NavItemModel,

	// New Method

	setActive(index) {
		this.each((model, modelIndex) => {
			if (index === modelIndex) {
				model.set('isActive', true);
			} else {
				model.set('isActive', false);
			}
		});
	}
});

AppEssentials.Backbone.Components.NavView = AppEssentials.Backbone.View.extend({
	attributes: { role: 'navigation' },

	initialize(options) {
		this.navItems = [];

		this.listenTo(options.collection, 'update', () => {
			this.render();
		});

		AppEssentials.Backbone.View.prototype.initialize.call(this, options);
	},

	removeNavItems() {
		this.navItems.forEach(navItem => navItem.remove());
		this.navItems = [];
	},

	remove() {
		this.removeNavItems();
		AppEssentials.Backbone.View.prototype.remove.call(this);
	},

	render() {
		this.removeNavItems();
		while (this.el.firstChild) {
			this.removeChild(this.el.firstChild);
		}

		const wrapper = this.el.appendChild(document.createElement('ul'));
		wrapper.classList.add('nav', 'nav-tabs');

		const navItemViewRenderPromises = [];
		this.collection.each(model => {
			let navItemView;
			if (model.get('requiresLogin')) {
				navItemView = new AppEssentials.Backbone.Components.AuthyNavItemView({ model, authModel: this.authModel });
			} else {
				navItemView = new AppEssentials.Backbone.Components.NavItemView({ model });
			}

			if (navItemView) {
				wrapper.appendChild(navItemView.el);
				navItemViewRenderPromises.push(navItemView.render());
				this.navItems.push(navItemView);
			}
		});

		return Promise.all(navItemViewRenderPromises)
			.then(() => {
				return AppEssentials.Backbone.View.prototype.render.call(this);
			});
	}
});
