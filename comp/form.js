/* global _ $ doAjax loadScripts AlertModel AlertView BaseView */

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
				this.removeChild(this.el.firstChild);
			}

			let formDefinition = _.result(this, 'formDefinition');

			return Promise.resolve()
				.then(() => {
					if (typeof formDefinition === 'string') {
						return doAjax({
							url: formDefinition
						}).then(({ data }) => {
							formDefinition = data;
						});
					}
				})
				.then(() => {
					if (formDefinition.scripts) {
						return loadScripts(...formDefinition.scripts);
					}
				})
				.then(() => {
					formDefinition.id =
						_.result(formDefinition, 'id') || FormView.uniqueId();
					formDefinition.rootPath =
						_.result(formDefinition, 'rootPath') ||
						_.result(this, 'rootPath');
					formDefinition.useBinding = true;

					// NOTE: Weird behaviour - Assigning functions into existing object changes the function's context to previous instance...
					// So I had to keep function in temporary object by duplicating the definition.
					const tempFormDefinition = {};
					for (const key in formDefinition) {
						if ({}.hasOwnProperty.call(formDefinition, key)) {
							tempFormDefinition[key] = formDefinition[key];
						}
					}

					tempFormDefinition.success =
						formDefinition.success ||
						(event => {
							event.preventDefault();
							this.success();
							return false;
						});

					this.cotForm = new window.CotForm(tempFormDefinition);
					this.cotForm.setModel(this.model);
					this.cotForm.setView(this);

					return Promise.resolve()
						.then(() => {
							return this.cotForm.render({ target: this.el });
						})
						.then(() => {
							this.form = this.el.querySelector('form');
							this.formValidator = $(this.form).data('formValidation');

							return BaseView.prototype.render.call(this);
						});
				});
		},

		showAlert(message, sectionIndex, className = 'alert-danger') {
			let parentNode = this.form;

			if (sectionIndex != null) {
				parentNode = parentNode.querySelectorAll('.panel-body')[
					sectionIndex
				];
			}

			const alertView = new AlertView({
				className: `alert ${className} alert-dismissible`,
				model: new AlertModel({
					message
				})
			});

			parentNode.insertBefore(alertView.el, parentNode.firstChild);

			return alertView.render();
		},

		success() {
			this.prepareForSubmission();

			this.model.save().then(() => {
				this.showAlert(
					'<strong>Submission successful.</strong> You have successfully submitted the form.',
					0,
					'alert-success'
				);
				this.restoreFromSubmission();
				this.trigger('success');
			}, () => {
				this.showAlert(
					'<strong>Submission failed.</strong> An error occured while submitting the form.',
					0,
					'alert-danger'
				);
				this.restoreFromSubmission();
				this.trigger('failed');
			});

		},

		disabledControls: null,

		prepareForSubmission() {
			if (!this.disabledControls) {
				this.disabledControls = [];
			}

			let disabledControl = this.el.querySelector(
				'.cot-form .form-control:not([disabled]), .cot-form .form-group button:not([disabled])'
			);
			while (disabledControl) {
				this.disabledControls.push(disabledControl);
				disabledControl.setAttribute('disabled', '');
				disabledControl = this.el.querySelector(
					'.cot-form .form-control:not([disabled]), .cot-form .form-group button:not([disabled])'
				);
			}
		},

		restoreFromSubmission() {
			if (this.disabledControls) {
				this.disabledControls.forEach(disabledControl => {
					disabledControl.removeAttribute('disabled');
				});
				this.disabledControls = null;
			}

			this.formValidator.resetForm();
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
