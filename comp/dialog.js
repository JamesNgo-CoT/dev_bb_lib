/* global BaseModel BaseView */

/* exported DialogModel */
const DialogModel = BaseModel.extend({
	defaults: {
		id: '',
		size: 'lg',
		heading: 'HEADING',
		body: 'BODY',
		footer: '<button class="btn btn-primary" data-dismiss="modal">Close</button>'
	}
});

/* exported DialogView */
const DialogView = BaseView.extend({
	attributes: {
		tabindex: '-1',
		role: 'dialog',

		'aria-hidden': 'true',
		'aria-modal': 'true',

		'data-view': 'DialogView'
	},

	events: {
		['show.bs.modal']() {
			this.lastActiveElement = document.activeElement;
		},

		['shown.bs.modal']() {
			console.log(this, this.el, this.el.parentNode, this.el.querySelector('.modal-title span[tabindex="-1"]'));
			// this.el.querySelector('.modal-title span[tabindex="-1"]').focus();
		},

		['hidden.bs.modal']() {
			if (this.lastActiveElement) {
				this.lastActiveElement.focus();
			}
			this.trigger('hidden.bs.modal');
		}
	},

	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		this.el.classList.add('modal', 'fade');

		if (this.model.has('id')) {
			this.el.setAttribute('aria-labelledby', `${this.model.get('id')}_title`);
		}

		const dialog = this.el.appendChild(document.createElement('div'));
		dialog.classList.add('modal-dialog');
		if (this.model.has('size')) {
			dialog.classList.add(`modal-${this.model.get('size')}`);
		}
		dialog.setAttribute('role', 'document');

		const content = dialog.appendChild(document.createElement('div'));
		content.classList.add('modal-content');

		const header = content.appendChild(document.createElement('div'));
		header.classList.add('modal-header');

		const headerButton = header.appendChild(document.createElement('button'));
		headerButton.classList.add('close');
		headerButton.setAttribute('type', 'button');
		headerButton.setAttribute('aria-label', 'Close');
		headerButton.setAttribute('data-dismiss', 'modal');
		headerButton.innerHTML = '<span aria-hidden="true">&times;</span>';

		const headerTitle = header.appendChild(document.createElement('div'));
		headerTitle.classList.add('modal-title');
		if (this.model.has('id')) {
			headerTitle.setAttribute('id', `${this.model.get('id')}_title`);
		}
		headerTitle.setAttribute('role', 'heading');
		headerTitle.setAttribute('aria-level', '2');

		const headerTitleSpan = headerTitle.appendChild(document.createElement('span'));
		headerTitleSpan.setAttribute('tabindex', '-1');

		const headingContent = this.model.get('heading');
		if (typeof headingContent === 'string') {
			headerTitleSpan.innerHTML = headingContent;
		} else if (headingContent instanceof HTMLElement) {
			headerTitleSpan.appendChild(headingContent);
		}

		const body = content.appendChild(document.createElement('div'));
		body.classList.add('modal-body');

		const bodyContent = this.model.get('body');
		if (typeof bodyContent === 'string') {
			body.innerHTML = bodyContent;
		} else if (bodyContent instanceof HTMLElement) {
			body.appendChild(bodyContent);
		}

		const footer = content.appendChild(document.createElement('div'));
		footer.classList.add('modal-footer');

		const footerContent = this.model.get('footer');
		if (typeof footerContent === 'string') {
			footer.innerHTML = footerContent;
		} else if (footerContent instanceof HTMLElement) {
			footer.appendChild(footerContent);
		}

		return BaseView.prototype.render.call(this);
	},

	close() {
		this.$el.modal('hide');
	},

	open() {
		this.$el.modal('show');
	}
});
