/* global _ $ deepCloneObject doAjax loadScripts stringToFunction CotForm AlertModel AlertView BaseView */

/* exported FormView */
const FormView = BaseView.extend({
	// PROPERTY

	attributes: {
		'data-view': 'FormView'
	},

	// METHODS

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

	remove() {
		this.removeCotForm();
		BaseView.prototype.remove.call(this);
	},

	removeCotForm() {
		this.cotForm = null;
		this.form = null;
		this.formValidator = null;
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
					return doAjax({ url: formDefinition })
						.then(({ data }) => {
							formDefinition = data;
						});
				}

				formDefinition = deepCloneObject(formDefinition);
			})
			.then(() => {
				// formDefinition.id = _.result(formDefinition, 'id') || FormView.uniqueId();
				formDefinition.rootPath = _.result(formDefinition, 'rootPath') || _.result(this, 'rootPath');
				formDefinition.useBinding = true;
				formDefinition.success = formDefinition.success || ((event) => {
					event.preventDefault();
					this.success();
					return false;
				});

				if (formDefinition.scripts) {
					if (!Array.isArray(formDefinition.scripts)) {
						formDefinition.scripts = [formDefinition.scripts];
					}

					return loadScripts(...formDefinition.scripts);
				}
			})
			.then(() => {
				function renderLoop({ definition, preRender, preRenderSection, preRenderRow, renderField, postRenderRow,
					prostRenderSection, postRender }) {

					const renderPromises = [];

					renderPromises.push(preRender ? preRender({ definition }) : null);

					const sections = definition.sections || [];
					sections.forEach(section => {
						renderPromises.push(preRenderSection ? preRenderSection({ definition, section }) : null);

						const rows = section.rows || [];
						rows.forEach(row => {
							renderPromises.push(preRenderRow ? preRenderRow({ definition, section, row }) : null);

							const fields = row.fields || [];
							fields.forEach(field => {
								renderPromises.push(renderField ? renderField({ definition, section, row, field }) : null);
							});

							const grid = row.grid || {};
							const gridfields = grid.fields || [];
							gridfields.forEach(field => {
								renderPromises.push(renderField ? renderField({ definition, section, row, grid, field }) : null);
							});

							const repeatControl = row.repeatControl || {};
							const repeatControlRows = repeatControl.rows || [];
							repeatControlRows.forEach(repeatControlRow => {
								const fields = repeatControlRow.fields || [];
								fields.forEach(field => {
									renderPromises.push(renderField
										? renderField({ definition, section, row, repeatControl, repeatControlRow, field })
										: null);
								});
							});

							renderPromises.push(postRenderRow ? postRenderRow({ definition, section, row }) : null);
						});

						renderPromises.push(prostRenderSection ? prostRenderSection({ definition, section }) : null);
					});

					renderPromises.push(postRender ? postRender({ definition }) : null);

					return Promise.all(renderPromises);
				}

				return Promise.resolve()
					.then(() => {
						return renderLoop({
							definition: formDefinition,
							preRender({ definition }) {
								const renderer = stringToFunction(definition.preRender);
								if (renderer) {
									return renderer({ view: this, model: this.model, definition });
								}
							},
							preRenderSection({ definition, section }) {
								const renderer = stringToFunction(section.preRender);
								if (renderer) {
									return renderer({ view: this, model: this.model, definition, section });
								}
							},
							preRenderRow({ definition, section, row }) {
								const renderer = stringToFunction(row.preRender);
								if (renderer) {
									return renderer({ view: this, model: this.model, definition, section, row });
								}
							},
							renderField({ definition, section, row, grid, repeatControl, repeatControlRow, field }) {
								return Promise.resolve()
									.then(() => {

									})
									.then(() => {
										if (field.choices) {
											if (typeof field.choices === 'string') {
												return doAjax({
													url: field.choices
												}).then(({ data }) => {
													field.choices = data;
												});
											}
										}
									})
									.then(() => {
										if (field.choices) {
											if (field.choicesMap) {
												field.choicesMap = stringToFunction(field.choicesMap);
												field.choices = field.choicesMap(field.choices);
											}

											if (field.type === 'dropdown' && (field.choices.length === 0 || field.choices[0].value !== '')) {
												field.choices.unshift({ text: `- Select -`, value: '' });
											}

											let value;
											if (field.bindTo && this.model && this.model.has(field.bindTo)) {
												value = this.model.get(field.bindTo);
											} else if (field.value) {
												value = field.value;
											}

											if (value) {
												const choices = field.choices.map(choice =>
													choice.value != null ? choice.value : choice.text
												);

												if (!Array.isArray(value)) {
													value = [value];
												}

												value.forEach(val => {
													if (choices.indexOf(val) === -1) {
														field.choices.unshift({ text: value, value });
													}
												});
											}
										}

										const renderer = stringToFunction(field.preRender);
										if (renderer) {
											return renderer({ view: this, model: this.model, definition, section, row, grid, repeatControl, repeatControlRow, field });
										}
									});
							}
						});
					})
					.then(() => {
						console.log(formDefinition);
						this.cotForm = new CotForm(formDefinition);
						this.cotForm.setModel(this.model);
						this.cotForm.setView(this);

						return this.cotForm.render({ target: this.el });
					})
					.then(() => {
						this.form = this.el.querySelector('form');
						this.formValidator = $(this.form).data('formValidation');

						return renderLoop({
							definition: formDefinition,
							renderField({ definition, section, row, grid, repeatControl, repeatControlRow, field }) {
								const renderer = stringToFunction(field.postRender);
								if (renderer) {
									return renderer({
										cotForm: this.cotForm, form: this.form, formValidator: this.formValidator,
										view: this, model: this.model, definition, section, row, grid, repeatControl,
										repeatControlRow, field
									});
								}
							},
							postRenderRow({ definition, section, row }) {
								const renderer = stringToFunction(row.postRender);
								if (renderer) {
									return renderer({
										cotForm: this.cotForm, form: this.form, formValidator: this.formValidator,
										view: this, model: this.model, definition, section, row
									});
								}
							},
							postRenderSection({ definition, section }) {
								const renderer = stringToFunction(section.postRender);
								if (renderer) {
									return renderer({ cotForm: this.cotForm, view: this, model: this.model, definition, section });
								}
							},
							postRender({ definition }) {
								const renderer = stringToFunction(definition.postRender);
								if (renderer) {
									return renderer({
										cotForm: this.cotForm, form: this.form, formValidator: this.formValidator,
										view: this, model: this.model, definition
									});
								}
							}
						});
					})
					.then(() => {
						return BaseView.prototype.render.call(this);
					});
			});
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
	}
});
