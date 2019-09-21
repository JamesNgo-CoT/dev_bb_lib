/* global htm BaseModel BaseCollection BaseView */

/* exported NavItemModel */
const NavItemModel = BaseModel.extend({

	// PROPERTY

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
	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	// PROPERTIES

	attributes: {
		'role': 'presentation',
		'data-view': 'NavItemView'
	},

	tagName: 'li',

	// METHODS

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

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

		const docFragment = document.createDocumentFragment();

		docFragment.appendChild(htm('a', {
			'href': `#${this.model.escape('fragment')}`
		}, [
			this.model.escape('title')
		], []));

		this.el.appendChild(docFragment);

		return BaseView.prototype.render.call(this);
	}
});

/* exported NavCollection */
const NavCollection = BaseCollection.extend({

	// PROPERTY

	model: NavItemModel,

	// METHOD

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
	initialize(options) {
		this.listenTo(options.collection, 'update', () => {
			this.render();
		});
		this.listenTo(options.collection, 'reset', () => {
			this.render();
		});
		BaseView.prototype.initialize.call(this, options);
	},

	// PROPERTY

	attributes: {
		'role': 'navigation',
		'data-view': 'NavView'
	},

	// METHOD

	render() {
		this.removeSubViews();
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}
		this.subViews = [];

		const promises = [];

		if (this.collection.length > 0) {
			const docFragment = document.createDocumentFragment();

			docFragment.appendChild(htm('div', {}, [
				htm('ul', {
					'class': 'nav nav-tabs'
				}, [
					...this.collection.map((model) => {
						const navItemView = new NavItemView({ model });
						navItemView.render();
						this.subViews.push(navItemView);
						return navItemView.el;
					})
				], [])
			], []));

			this.el.appendChild(docFragment);
		}

		return Promise.all(promises).then(() => BaseView.prototype.render.call(this));
	}
});
