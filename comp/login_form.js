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
									'Need help logging in? Contact <a href="mailto:itservice@toronto.ca">IT Service Desk</a> or all 416-338-2255'
							}
						]
					}
				]
			}
		]
	},

	prepareForSubmission() {
		FormView.prototype.prepareForSubmission.call(this);

		const button = this.el.querySelector('.btn-login');
		const buttonText = button.querySelectorAll('span')[1];
		buttonText.textContent = 'Verifying information';
	},

	restoreFromSubmission(isSuccessful) {
		FormView.prototype.restoreFromSubmission.call(this);

		const button = this.el.querySelector('.btn-login');
		const buttonText = button.querySelectorAll('span')[1];
		buttonText.textContent = 'Login';

		if (isSuccessful === true) {
			this.showAlert('<strong>Login successful.</strong> You have successfully logged in.', 0, 'alert-success');
		} else if (isSuccessful === false) {
			this.showAlert(
				'<strong>Login failed.</strong> Please review your user name and password and try again.',
				0,
				'alert-danger'
			);
		}
	}
});
