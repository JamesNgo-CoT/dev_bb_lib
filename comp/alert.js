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

	className: 'alert-danger',

	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		BaseView.prototype.initialize.call(this, options);
	},

	render() {
		while (this.el.firstChild) {
			this.removeChild(this.el.firstChild);
		}

		this.el.classList.add('alert', 'alert-dismissible');

		const messageElementButton = this.el.appendChild(
			document.createElement('button')
		);
		messageElementButton.setAttribute('type', 'button');
		messageElementButton.setAttribute('data-dismiss', 'alert');
		messageElementButton.setAttribute('aria-label', 'Close');
		messageElementButton.classList.add('close');

		const messageElementButtonTimes = messageElementButton.appendChild(
			document.createElement('span')
		);
		messageElementButtonTimes.setAttribute('aria-hidden', 'true');
		messageElementButtonTimes.innerHTML = '&times;';

		const innerMessageElement = this.el.appendChild(
			document.createElement('div')
		);
		const message = this.model.get('message');
		if (typeof message === 'string') {
			innerMessageElement.innerHTML = message;
		} else {
			innerMessageElement.appendChild(message);
		}

		return BaseView.prototype.render.call(this);
	},

	close() {
		this.el.querySelector('button[data-dismiss="alert"]').click();
	}
});
