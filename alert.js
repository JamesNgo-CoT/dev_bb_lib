/* global BaseModel BaseView */

/* exported AlertModel */
const AlertModel = BaseModel.extend({
	defaults: {
		message: null
	}
});

/* exported AlertView */
const AlertView = BaseView.extend({
	attributes: { role: 'alert', 'data-view': 'AlertView' },

	className: 'alert alert-danger alert-dismissible',

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

		const fragment = document.createDocumentFragment();

		const btn = fragment.appendChild(document.createElement('button'));
		btn.setAttribute('type', 'button');
		btn.setAttribute('data-dismiss', 'alert');
		btn.setAttribute('aria-label', 'Close');
		btn.classList.add('close');

		const btnSpan = btn.appendChild(document.createElement('span'));
		btnSpan.setAttribute('aria-hidden', 'true');
		btnSpan.innerHTML = '&times;';

		const messageArea = fragment.appendChild(document.createElement('div'));
		const message = this.model.get('message');
		if (typeof message === 'string') {
			messageArea.innerHTML = message;
		} else {
			messageArea.appendChild(message);
		}

		this.el.appendChild(fragment);

		return BaseView.prototype.render.call(this);
	},

	close() {
		this.el.querySelector('button[data-dismiss="alert"]').click();
	}
});
