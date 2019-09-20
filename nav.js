/* global BaseModel BaseCollection BaseView */

/* exported NavItemModel */
const NavItemModel = BaseModel.extend({
	defaults: {
		id: null,
		title: 'Untitled',
		fragment: '',
		isActive: false,
		isVisible: true,
		group: null
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

	setActive(index, group, activeCallback) {
		this.forEach((model, modelIndex) => {
			if (group == null || group === model.get('group')) {
				if (typeof index === 'number') {
					if (index === modelIndex) {
						model.set('isActive', true);
					} else {
						model.set('isActive', false);
					}
				} else {
					if (index === model.id) {
						model.set('isActive', true);
					} else {
						model.set('isActive', false);
					}
				}
				if (activeCallback) {
					activeCallback(model, modelIndex);
				}
				model.set('isVisible', true);
			} else {
				model.set('isVisible', false);
			}
		});
	}
});

/* exported NavView */
const NavView = BaseView.extend({
	attributes: { role: 'navigation', 'data-view': 'NavView' },

	initialize(options) {
		this.listenTo(options.collection, 'update', () => {
			this.render();
		});
		this.listenTo(options.collection, 'reset', () => {
			this.render();
		});
		BaseView.prototype.initialize.call(this, options);
	},

	render() {
		this.removeSubViews();
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}
		this.subViews = [];

		const promises = [];

		if (this.collection.length > 0) {
			const docFragment = document.createDocumentFragment();

			const outerWrapper = docFragment.appendChild(document.createElement('div'));

			const wrapper = outerWrapper.appendChild(document.createElement('ul'));
			wrapper.classList.add('nav', 'nav-tabs');

			this.collection.forEach(model => {
				const navItemView = new NavItemView({ model });
				this.subViews.push(navItemView);
				promises.push(navItemView.appendTo(wrapper).render());
			});

			this.el.appendChild(docFragment);
		}

		return Promise.all(promises).then(() => BaseView.prototype.render.call(this));
	},

	hide() {
		this.el.classList.add('hide');
		return this;
	},

	show() {
		this.el.classList.remove('hide');
		return this;
	}
});
