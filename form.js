/* global _ $ doAjax loadScripts CotForm AlertModel AlertView BaseView */

/* exported FormView */
const FormView = BaseView.extend(
	{
		attributes: { 'data-view': 'FormView' },

		removeCotForm() {
			this.cotForm = null;
			this.form = null;
			this.formValidator = null;
		},

		remove() {
			this.removeCotForm();
			BaseView.prototype.remove.call(this);
		},

		render() {
			this.removeCotForm();
			while (this.el.firstChild) {
				this.el.removeChild(this.el.firstChild);
			}

			let formDefinition = _.result(this, 'formDefinition');
			return Promise.resolve()
				.then(() => {
					if (typeof formDefinition === 'string') {
						return doAjax({ url: formDefinition }).then(({ data }) => {
							formDefinition = data;
						});
					}
				})
				.then(() => {
					formDefinition = Object.assign({}, formDefinition);

					if (formDefinition.scripts) {
						return loadScripts(...formDefinition.scripts);
					}
				})
				.then(() => {
					return Promise.resolve()
						.then(() => {
							formDefinition.id = _.result(formDefinition, 'id') || FormView.uniqueId();
							formDefinition.rootPath = _.result(formDefinition, 'rootPath') || _.result(this, 'rootPath');
							formDefinition.useBinding = true;

							formDefinition.success =
								formDefinition.success ||
								(event => {
									event.preventDefault();
									this.success();
									return false;
								});

							this.cotForm = new CotForm(formDefinition);
							this.cotForm.setModel(this.model);
							this.cotForm.setView(this);

							return this.cotForm.render({ target: this.el });
						})
						.then(() => {
							this.form = this.el.querySelector('form');
							this.formValidator = $(this.form).data('formValidation');

							return BaseView.prototype.render.call(this);
						});
				});
		},

		prepareForSuccess() {
			if (!this.disabledControls) {
				this.disabledControls = [];
			}

			let disabledControl = this.el.querySelector(
				'.cot-form .form-control:not([disabled]), .cot-form button:not([disabled])'
			);
			while (disabledControl) {
				this.disabledControls.push(disabledControl);
				disabledControl.setAttribute('disabled', '');
				disabledControl = this.el.querySelector(
					'.cot-form .form-control:not([disabled]), .cot-form button:not([disabled])'
				);
			}
		},

		success() {
			this.prepareForSuccess();
			this.model.save().then(
				() => {
					this.showAlert(
						'<strong>Submission successful.</strong> You have successfully submitted the form.',
						null,
						'alert-success'
					);
					this.restoreFromSuccess();
					this.trigger('success');
				},
				() => {
					this.showAlert(
						'<strong>Submission failed.</strong> An error occured while submitting the form.',
						null,
						'alert-danger'
					);
					this.restoreFromSuccess();
					this.trigger('failed');
				}
			);
		},

		restoreFromSuccess() {
			if (this.disabledControls) {
				this.disabledControls.forEach(disabledControl => {
					disabledControl.removeAttribute('disabled');
				});
				this.disabledControls = null;
			}

			this.formValidator.resetForm();
		},

		showAlert(message, sectionIndex, className = 'alert-danger') {
			let parentNode = this.form;
			if (sectionIndex != null) {
				parentNode = parentNode.querySelectorAll('.panel-body')[sectionIndex];
			}

			const alertView = new AlertView({
				className: `alert ${className} alert-dismissible`,
				model: new AlertModel({ message })
			});
			parentNode.insertBefore(alertView.el, parentNode.firstChild);
			return alertView.render();
		}
	},
	{
		uniqueId() {
			if (FormView._uniqueId == null) {
				FormView._uniqueId = 0;
			}
			return `FormView_${FormView._uniqueId++}`;
		}
	}
);
