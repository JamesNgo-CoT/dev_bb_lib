/* global BaseView DialogModel DialogView LoginFormView */

/* exported LoginFormDialogView */
const LoginFormDialogView = BaseView.extend({
	removeDialogView() {
		if (this.dialogView) {
			this.dialogView.remove();
			this.dialogView = null;
		}
	},

	remove() {
		this.removeDialogView();
		BaseView.prototype.remove.call(this);
	},

	render() {
		this.removeDialogView();
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		const loginForm = new LoginFormView({
			model: this.model
		});

		const footer = document.createElement('div');

		const loginButton = footer.appendChild(document.createElement('button'));
		loginButton.textContent = 'Login';
		loginButton.setAttribute('type', 'button');
		loginButton.classList.add('btn', 'btn-primary');
		loginButton.addEventListener('click', () => {
			loginForm.el.querySelector('.btn-login').click();
		});

		footer.appendChild(document.createTextNode(' '));

		const cancelButton = footer.appendChild(document.createElement('button'));
		cancelButton.textContent = 'Cancel';
		cancelButton.setAttribute('type', 'button');
		cancelButton.setAttribute('data-dismiss', 'modal');
		cancelButton.classList.add('btn', 'btn-default');

		const model = new DialogModel({
			size: 'md',
			heading: 'User Login',
			body: loginForm.el,
			footer
		});

		this.dialogView = new DialogView({
			model
		});
		this.dialogView.appendTo(this.el);

		// ???
		loginForm.on('loggingin', () => {
			loginButton.setAttribute('disabled', '');
			loginButton.textContent = 'Verifying information';
		});

		loginForm.on('failed', () => {
			loginButton.removeAttribute('disabled');
			loginButton.textContent = 'Login';
		});

		loginForm.on('success', () => {
			loginButton.removeAttribute('disabled');
			loginButton.textContent = 'Login';
			this.dialogView.close();
		});

		return loginForm
			.render()
			.then(() => this.dialogView.render())
			.then(() => BaseView.prototype.render.call(this));
	},

	close() {
		this.dialogView.close();
	},

	open() {
		this.dialogView.open();
	}
});
