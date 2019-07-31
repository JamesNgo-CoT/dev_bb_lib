/* global AppEssentials */

AppEssentials.Backbone.Components.LoginFormView = AppEssentials.Backbone.Components.FormView.extend({

	// Overriden Properties

	events: {
		['click .btn-login']() {
			this.el.querySelector('.fv-hidden-submit').click();
		}
	},

	formDefinition: {
		sections: [
			{
				title: 'Login',

				rows: [
					{
						fields: [
							{
								type: 'html',
								html: 'Login using your City of Toronto username and password.'
							}
						]
					},
					{
						fields: [
							{
								title: 'User Name',
								required: true,
								bindTo: 'user'
							}
						]
					},
					{
						fields: [
							{
								title: 'Password',
								type: 'password',
								required: true,
								bindTo: 'pwd'
							}
						]
					},
					{
						fields: [
							{
								title: 'Login',
								type: 'button',
								btnClass: 'primary btn-login'
							}
						]
					},
					{
						fields: [
							{
								type: 'html',
								html: 'Need help logging in? Contact <a href="mailto:itservice@toronto.ca">IT Service Desk</a> or all 416-338-2255'
							}
						]
					}
				]
			}
		]
	},

	// Overriden Methods

	initialize(options) {
		this.model = AppEssentials.Shared.loginModel;
		AppEssentials.Backbone.Components.FormView.prototype.initialize.call(this, options)
	},

	success() {
		const button = this.el.querySelector('.btn-login');
		button.setAttribute('disabled', '');

		const buttonText = button.querySelectorAll('span')[1];
		buttonText.textContent = 'Verifying information';

		this.model.login()
			.then(() => {
				AppEssentials.Backbone.Components.FormView.prototype.success.call(this);
			}, () => {
				this.showAlert('<strong>Login failed.</strong> Please review your user name and password and try again.', 0);
			})
			.then(() => {
				this.formValidator.resetForm();

				buttonText.textContent = 'Login';
				button.removeAttribute('disabled');
			});
	}
});
