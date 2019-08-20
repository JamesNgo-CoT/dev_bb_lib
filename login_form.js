/* global FormView */

/* exported LoginFormView */
const LoginFormView = FormView.extend({
	attributes: { 'data-view': 'LoginFormView' },

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
								html:
									'Need help logging in? Contact <a href="mailto:itservice@toronto.ca">IT Service Desk</a> or all 416-338-2255.'
							}
						]
					}
				]
			}
		]
	},

	prepareForSuccess() {
		FormView.prototype.prepareForSuccess.call(this);

		const button = this.el.querySelector('.btn-login');
		const buttonText = button.querySelectorAll('span')[1];
		buttonText.textContent = 'Verifying information';
	},

	success() {
		this.prepareForSuccess();

		this.model.login().then(
			() => {
				this.restoreFromSuccess();
				this.showAlert('<strong>Login successful.</strong> You have successfully logged in.', 0, 'alert-success');
				this.trigger('success');
			},
			() => {
				this.restoreFromSuccess();
				this.showAlert(
					'<strong>Login failed.</strong> Please review your user name and password and try again.',
					0,
					'alert-danger'
				);
				this.trigger('failed');
			}
		);
	},

	restoreFromSuccess() {
		FormView.prototype.restoreFromSuccess.call(this);

		const button = this.el.querySelector('.btn-login');
		const buttonText = button.querySelectorAll('span')[1];
		buttonText.textContent = 'Login';
	}
});
