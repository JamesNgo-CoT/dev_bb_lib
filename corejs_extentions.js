/* global
	doAjax stringToFunction
	cot_app cot_form CotForm
*/

if (window.cot_app) {
	const originalRender = cot_app.prototype.render;
	cot_app.prototype.render = function() {
		this.titleElement = document.querySelector('#app-header h1');
		this.titleElement.setAttribute('tabindex', '-1');
		return originalRender.call(this);
	};

	cot_app.prototype.setTitle = function(title, subTitle) {
		if (this.titleElement == null) {
			return;
		}

		this.titleElement.innerHTML = title;

		let documentTitles = [];
		if (subTitle) {
			documentTitles.push(subTitle);
		}
		if (title !== this.name) {
			documentTitles.push(title);
		}
		documentTitles.push(this.name);
		document.title = documentTitles.join(' - ');
	};
}

if (window.cot_form) {
	const originalAddformfield = cot_form.prototype.addformfield;
	cot_form.prototype.addformfield = function(fieldDefinition, fieldContainer) {
		originalAddformfield.call(this, fieldDefinition, fieldContainer);

		if (fieldDefinition['readOnly'] === true) {
			switch (fieldDefinition['type']) {
				case 'email':
				case 'number':
				case 'password':
				case 'text':
					fieldContainer.querySelector(`[type="${fieldDefinition['type']}"]`).setAttribute('readonly', '');
					break;

				case 'phone':
					fieldContainer.querySelector('[type="tel"]').setAttribute('readonly', '');
					break;

				case 'textarea':
					fieldContainer.querySelector('textarea').setAttribute('readonly', '');
					break;
			}
		}
	};

	const originalValidatorOptions = cot_form.prototype.validatorOptions;
	cot_form.prototype.validatorOptions = function(fieldDefinition) {
		const returnValue = originalValidatorOptions.call(this, fieldDefinition);

		if (fieldDefinition['excluded'] != null) {
			returnValue['excluded'] = fieldDefinition['excluded'];
		}

		return returnValue;
	};
}

if (window.CotForm) {
	const originalRender = CotForm.prototype.render;
	CotForm.prototype.render = function(...args) {
		function renderLoop({ definition, renderSection, renderRow, renderField }) {
			const renderPromises = [];

			const sections = definition.sections;
			sections.forEach(section => {
				renderPromises.push(renderSection({ definition, section }));

				const rows = section.rows;
				rows.forEach(row => {
					renderPromises.push(renderRow({ definition, section, row }));

					const fields = row.fields;
					if (fields) {
						fields.forEach(field => {
							renderPromises.push(renderField({ definition, section, row, field }));
						});
					}

					const grid = row.grid;
					if (grid) {
						const fields = grid.fields;
						fields.forEach(field => {
							renderPromises.push(renderField({ definition, section, row, field, grid }));
						});
					}

					const repeatControl = row.repeatControl;
					if (repeatControl) {
						const repeatControlRows = repeatControl.rows;
						repeatControlRows.forEach(repeatControlRow => {
							const fields = repeatControlRow.fields;
							fields.forEach(field => {
								renderPromises.push(
									renderField({ definition, section, row, field, repeatControl, repeatControlRow })
								);
							});
						});
					}
				});
			});

			return Promise.all(renderPromises);
		}

		const cotForm = this;
		const model = cotForm.getModel();
		const view = cotForm.getView();

		let definition = this._definition;

		return Promise.resolve()
			.then(() => {
				if (typeof definition === 'string') {
					return doAjax({ url: definition }).then(data => {
						definition = data;
					});
				}
			})
			.then(() => {
				const renderer = stringToFunction(definition.preRender);
				if (renderer) {
					return renderer.call(this, { cotForm, model, view, definition });
				}
			})
			.then(() => {
				return renderLoop({
					definition,
					renderSection({ definition, section }) {
						const renderer = stringToFunction(section.preRender);
						if (renderer) {
							return renderer.call(this, { cotForm, model, view, definition, section });
						}
					},
					renderRow({ definition, section, row }) {
						const renderer = stringToFunction(row.preRender);
						if (renderer) {
							return renderer.call(this, { cotForm, model, view, definition, section, row });
						}
					},
					renderField({ definition, section, row, field, grid, repeatControl, repeatControlRow }) {
						return Promise.resolve()
							.then(() => {
								if (field.choices) {
									if (!field.originalChoices) {
										if (Array.isArray(field.choices)) {
											field.originalChoices = field.choices.slice(0);
										} else {
											field.originalChoices = field.choices;
										}
									}

									if (Array.isArray(field.originalChoices)) {
										field.choices = field.originalChoices.slice(0);
									} else {
										field.choices = field.originalChoices;
									}

									if (typeof field.choices === 'string') {
										return doAjax({
											url: field.choices
										}).then(data => {
											field.choices = data;
										});
									}
								}
							})
							.then(() => {
								const renderer = stringToFunction(field.preRender);
								if (renderer) {
									return renderer.call(this, {
										cotForm,
										model,
										view,
										definition,
										section,
										row,
										field,
										grid,
										repeatControl,
										repeatControlRow
									});
								}

								if (field.choicesMap) {
									field.choicesMap = stringToFunction(field.choicesMap);
									field.choices = field.choicesMap(field.choices);
								}

								if (
									field.type === 'dropdown' &&
									(field.choices.length === 0 || field.choices[0].value !== '')
								) {
									field.choices.unshift({
										text: `- Select ${field.title} -`,
										value: ''
									});
								}

								if (field.choices) {
									let value;
									if (field.value != null) {
										value = field.value;
									} else if (field.bindTo != null && model && model.has(field.bindTo)) {
										value = model.get(field.bindTo);
									}

									if (value != null) {
										const choices = field.choices.map(choice =>
											choice.value != null ? choice.value : choice.text
										);
										if (choices.indexOf(value) === -1) {
											field.choices.unshift({ text: value, value });
										}
									}
								}
							});
					}
				});
			})
			.then(() => {
				return originalRender.call(this, ...args);
			})
			.then(() => {
				return renderLoop({
					definition,
					renderSection({ definition, section }) {
						const renderer = stringToFunction(section.postRender);
						if (renderer) {
							return renderer.call(this, { cotForm, model, view, definition, section });
						}
					},
					renderRow({ definition, section, row }) {
						const renderer = stringToFunction(row.postRender);
						if (renderer) {
							return renderer.call(this, { cotForm, model, view, definition, section, row });
						}
					},
					renderField({ definition, section, row, field, grid, repeatControl, repeatControlRow }) {
						const renderer = stringToFunction(field.postRender);
						if (renderer) {
							return renderer.call(this, {
								cotForm,
								model,
								view,
								definition,
								section,
								row,
								field,
								grid,
								repeatControl,
								repeatControlRow
							});
						}
					}
				});
			})
			.then(() => {
				const renderer = stringToFunction(definition.postRender);
				if (renderer) {
					return renderer.call(this, { cotForm, model, view, definition });
				}
			});
	};

	CotForm.prototype.getModel = function() {
		return this._model;
	};

	CotForm.prototype.setView = function(view) {
		this._view = view;
	};

	CotForm.prototype.getView = function() {
		return this._view;
	};

	const originalFillFromModel = CotForm.prototype._fillFromModel;
	CotForm.prototype._fillFromModel = function(model) {
		originalFillFromModel.call(this, model);

		if (this._isRendered) {
			var sections = this._definition['sections'] || [];
			for (let sectionIndex = 0, sectionsLength = sections.length; sectionIndex < sectionsLength; sectionIndex++) {
				var rows = sections[sectionIndex].rows;
				for (let rowIndex = 0, rowsLength = rows.length; rowIndex < rowsLength; rowIndex++) {
					const row = rows[rowIndex];
					if (row.repeatControl && row.repeatControl.bindTo) {
						const repeatControlCollection = model.get(row.repeatControl.bindTo);
						let index = 0;
						while (index < repeatControlCollection.models.length) {
							const model = repeatControlCollection.at(index);
							if (JSON.stringify(model.toJSON()) === JSON.stringify({})) {
								repeatControlCollection.remove(model);
								continue;
							}

							index++;
						}
					}
				}
			}
		}
	};
}
