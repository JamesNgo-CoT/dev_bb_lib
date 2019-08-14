/* global BaseModel BaseCollection BaseView */

/* exported NavItemModel */
const NavItemModel = BaseModel.extend({
	defaults: {
		title: 'Untitled',
		fragment: '',
		isActive: false,
		isVisible: true,
		requiresLogin: false
	}
});

/* exported NavItemView */
const NavItemView = BaseView.extend({
	attributes: { role: 'presentation', 'data-view': 'NavItemView' },

	tagName: 'li',

	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});
		BaseView.prototype.initialize.call(this, options);
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

		return BaseView.prototype.render.call(this);
	}
});

/* exported NavCollection */
const NavCollection = BaseCollection.extend({
	model: NavItemModel,

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

/* exported NavView */
const NavView = BaseView.extend({
	attributes: { role: 'navigation', 'data-view': 'NavView' },

	initialize(options) {
		this.navItems = [];
		this.listenTo(options.collection, 'update', () => {
			this.render();
		});
		BaseView.prototype.initialize.call(this, options);
	},

	removeNavItems() {
		this.navItems.forEach(navItem => navItem.remove());
		this.navItems = [];
	},

	remove() {
		this.removeNavItems();
		BaseView.prototype.remove.call(this);
	},

	render() {
		this.removeNavItems();
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		const wrapper = this.el.appendChild(document.createElement('ul'));
		wrapper.classList.add('nav', 'nav-tabs');

		return Promise.all(
			this.collection.map(model => {
				const navItemView = new NavItemView({ model });
				this.navItems.push(navItemView);
				return navItemView.appendTo(this.el).render();
			})
		).then(() => {
			return BaseView.prototype.render.call(this);
		});
	}
});
