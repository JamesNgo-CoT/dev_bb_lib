/* global AppEssentials */

AppEssentials.Backbone.Components.AlertModel = AppEssentials.Backbone.Model.extend({

	// Property

	defaults: {
		message: null
	}
});

AppEssentials.Backbone.Components.AlertView = AppEssentials.Backbone.View.extend({

	// Properties

	attributes: { role: 'alert' },

	className: 'alert-danger',

	// Methods

	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		AppEssentials.Backbone.View.prototype.initialize.call(this, options);
	},

	close() {
		this.el.querySelector('button[data-dismiss="alert"]').click();
	},

	render() {
		while (this.el.firstChild) {
			this.removeChild(this.el.firstChild);
		}

		this.el.classList.add('alert', 'alert-dismissible');

		const messageElementButton = this.el.appendChild(document.createElement('button'));
		messageElementButton.setAttribute('type', 'button');
		messageElementButton.setAttribute('data-dismiss', 'alert');
		messageElementButton.setAttribute('aria-label', 'Close');
		messageElementButton.classList.add('close');

		const messageElementButtonTimes = messageElementButton.appendChild(document.createElement('span'));
		messageElementButtonTimes.setAttribute('aria-hidden', 'true');
		messageElementButtonTimes.innerHTML = '&times;';

		const innerMessageElement = this.el.appendChild(document.createElement('div'));
		const message = this.model.get('message');
		if (typeof message === 'string') {
			innerMessageElement.innerHTML = message;
		} else {
			innerMessageElement.appendChild(message);
		}

		return AppEssentials.Backbone.View.prototype.render.call(this);
	}
});
