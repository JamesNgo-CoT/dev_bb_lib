
/* global _ AppEssentials jQuery */

AppEssentials.Backbone.Components.FormView = AppEssentials.Backbone.View.extend(
	{

		// Overriden Method

		render() {
			while (this.el.firstChild) {
				this.removeChild(this.el.firstChild);
			}

			let formDefinition = _.result(this, 'formDefinition');

			return Promise.resolve()
				.then(() => {
					if (typeof formDefinition === 'string') {
						return AppEssentials.Utilities.doAjax({
							url: formDefinition
						}).then((data) => {
							formDefinition = data;
						});
					}
				})
				.then(() => {
					if (formDefinition.scripts) {
						return AppEssentials.Utilities.loadScripts(...formDefinition.scripts);
					}
				})
				.then(() => {
					formDefinition.id = _.result(formDefinition, 'id') || AppEssentials.Backbone.Components.FormView.uniqueId();
					formDefinition.rootPath = _.result(formDefinition, 'rootPath') || _.result(this, 'rootPath');
					formDefinition.useBinding = true;

					// NOTE: Weird behaviour - Assigning functions into existing object changes the function's context to previous instance...
					// So I had to keep function in temporary object by duplicating the definition.
					const tempFormDefinition = {};
					for (const key in formDefinition) {
						if ({}.hasOwnProperty.call(formDefinition, key)) {
							tempFormDefinition[key] = formDefinition[key];
						}
					}

					tempFormDefinition.success = formDefinition.success || ((event) => {
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
							this.formValidator = jQuery(this.form).data('formValidation');

							return AppEssentials.Backbone.View.prototype.render.call(this);
						});
				});
		},

		// New Methods

		showAlert(message, sectionIndex) {
			let parentNode = this.form;

			if (sectionIndex != null) {
				parentNode = parentNode.querySelectorAll('.panel-body')[sectionIndex];
			}

			const model = new AppEssentials.Backbone.Components.AlertModel({ message });
			const alertView = new AppEssentials.Backbone.Components.AlertView({ model });

			console.log(alertView, alertView.el);
			parentNode.insertBefore(alertView.el, parentNode.firstChild);
			alertView.render();
		},

		success() {
			this.trigger('success');
		}
	},
	{
		uniqueId() {
			if (AppEssentials.Backbone.Components.FormView._uniqueId == null) {
				AppEssentials.Backbone.Components.FormView._uniqueId = 0;
			}

			return `FormView_${AppEssentials.Backbone.Components.FormView._uniqueId++}`;
		}
	}
);
