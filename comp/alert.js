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
			this.removeChild(this.el.firstChild);
		}

		const closeBtn = this.el.appendChild(document.createElement('button'));
		closeBtn.setAttribute('type', 'button');
		closeBtn.setAttribute('data-dismiss', 'alert');
		closeBtn.setAttribute('aria-label', 'Close');
		closeBtn.classList.add('close');

		const closeBtnSign = closeBtn.appendChild(document.createElement('span'));
		closeBtnSign.setAttribute('aria-hidden', 'true');
		closeBtnSign.innerHTML = '&times;';

		const messageRegion = this.el.appendChild(document.createElement('div'));
		const message = this.model.get('message');
		if (typeof message === 'string') {
			messageRegion.innerHTML = message;
		} else {
			messageRegion.appendChild(message);
		}

		return BaseView.prototype.render.call(this);
	},

	close() {
		this.el.querySelector('button[data-dismiss="alert"]').click();
	}
});
