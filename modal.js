/* global htm BaseModel BaseView */

/* exported ModalModel */
const ModalModel = BaseModel.extend({
	defaults: {
		id: null,
		size: null,
		heading: null,
		body: null,
		footer: '<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'
	}
});

/* exported ModalView */
const ModalView = BaseView.extend({
	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		return BaseView.prototype.initialize.call(this, options);
	},

	// PROPERTIES

	attributes: { tabindex: '-1', role: 'dialog', 'aria-hidden': 'true', 'aria-modal': 'true', 'data-view': 'DialogView' },

	events: {
		['show.bs.modal']() {
			this.lastActiveElement = document.activeElement;

			this.trigger('show.bs.modal');
		},
		['shown.bs.modal']() {
			this.el.querySelector('.modal-title span[tabindex="-1"]').focus();

			this.trigger('shown.bs.modal');
		},
		['hide.bs.modal']() {
			this.trigger('hide.bs.modal');
		},
		['hidden.bs.modal']() {
			console.log('hidden.bs.modal');

			if (this.lastActiveElement) {
				this.lastActiveElement.focus();
			}

			this.trigger('hidden.bs.modal');
		}
	},

	// METHODS

	close() {
		this.$el.modal('hide');
	},

	open() {
		this.$el.modal('show');
	},

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		this.el.classList.add('modal', 'fade');

		if (this.model.has('id')) {
			this.el.setAttribute('aria-labelledby', `${this.model.get('id')}_title`);
		}

		const docFragment = document.createDocumentFragment();

		const renderPromises = [
			docFragment.appendChild(htm.div({
				'class': `modal-dialog ${this.model.has('size') ? 'modal-' + this.model.get('size') : ''}`,
				'role': 'document'
			}, [
				htm.div({ 'class': 'modal-content' }, [
					htm.div({ 'class': 'modal-header' }, [
						htm.button({ 'class': 'close', 'type': 'button', 'aria-label': 'Close', 'data-dismiss': 'modal' }, [
							htm.span({ 'aria-hidden': 'true' }, [
								'&times;'
							], [])
						], []),

						htm.h4({
							'class': 'modal-title',
							'id': this.model.has('id') ? `${this.model.get('id')}_title` : null,
							'role': 'heading',
							'aria-level': 2
						}, [
							htm.span({ 'tabindex': -1 }, [
								this.model.get('heading')
							], [])
						], [])
					], []),

					htm.div({ 'class': 'modal-body' }, [
						this.model.get('body')
					], []),

					htm.div({ 'class': 'modal-footer' }, [
						this.model.get('footer')
					], [])
				], [])
			], [])).promise
		];

		this.el.appendChild(docFragment);

		return Promise.all(renderPromises)
			.then(() => BaseView.prototype.render.call(this));
	},

	show() {
		return new Promise((resolve) => {
			this.open();
			this.once('hidden.bs.modal', () => {
				resolve(this.model);
			});
		});
	}
});

ModalView.alert = (message = '') => {
	const modalModel = new ModalModel({
		heading: 'Alert',
		body: htm.p({}, [message], [])
	});

	const modalView = new ModalView({ model: modalModel });
	return modalView.render()
		.then(() => {
			return modalView.show()
				.then(() => {
					modalView.remove();
				})
		});
};

ModalView.confirm = (message = '', ok = 'OK', cancel = 'Cancel') => {
	let continueNavigation = false;

	const modalModel = new ModalModel({
		heading: 'Confirm',
		body: htm.p({}, [message], []),
		footer: htm.div({}, [
			htm.button({ 'class': 'btn btn-cancel', 'data-dismiss': 'modal' }, [cancel], []),
			htm.button({ 'class': 'btn btn-primary', 'data-dismiss': 'modal' }, [ok], [
				(element) => {
					element.addEventListener('click', () => {
						continueNavigation = true;
					});
				}
			])
		], [])
	});

	const modalView = new ModalView({ model: modalModel });
	return modalView.render()
		.then(() => {
			return modalView.show()
				.then(() => {
					modalView.remove();
					return continueNavigation;
				})
		});
};
