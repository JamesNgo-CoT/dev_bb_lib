/* global htm BaseModel BaseView */

/* exported AlertModel */
const AlertModel = BaseModel.extend({

	// PROPERTY

	defaults: {
		message: null
	}
});

/* exported AlertView */
const AlertView = BaseView.extend({
	initialize(options) {
		this.listenTo(options.model, 'change', () => {
			this.render();
		});

		return BaseView.prototype.initialize.call(this, options);
	},

	// PROPERTIES

	attributes: {
		'role': 'alert',
		'data-view': 'AlertView'
	},

	className: 'alert alert-danger alert-dismissible',

	// METHODS

	close() {
		this.el.querySelector('button[data-dismiss="alert"]').click();
	},

	render() {
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		const docFragment = document.createDocumentFragment();

		const renderPromises = [
			docFragment.appendChild(
				htm.button({ 'class': 'close', 'type': 'button', 'data-dismiss': 'alert', 'aria-label': 'Close' }, [
					htm.span({ 'aria-hidden': 'true' }, [
						'&times;'
					], [])
				], [])
			).promise,

			docFragment.appendChild(
				htm.div({}, [
					this.model.get('message')
				], [])
			).promise
		];

		this.el.appendChild(docFragment);

		return Promise.all(renderPromises)
			.then(() => BaseView.prototype.render.call(this));
	}
});
