/* global BaseView DialogModel DialogView LoginModel LoginFormView */

/* exported LoginFormDialogView */
const LoginFormDialogView = BaseView.extend({
	attributes: { 'data-view': 'LoginFormDialogView' },

	removeLoginFormView() {
		if (this.loginFormView) {
			this.loginFormView.remove();
			this.loginFormView = null;
		}
	},

	removeDialogView() {
		if (this.dialogView) {
			this.dialogView.remove();
			this.dialogView = null;
		}
	},

	remove() {
		this.removeLoginFormView();
		this.removeDialogView();
		BaseView.prototype.remove.call(this);
	},

	render() {
		return BaseView.prototype.render.call(this);
	},

	open() {
		return new Promise(resolve => {
			this.removeLoginFormView();
			this.removeDialogView();
			while (this.el.firstChild) {
				this.el.removeChild(this.el.firstChild);
			}

			const NewLoginModel = LoginModel.extend({
				urlRoot: this.model.urlRoot,
				webStorage: null
			});

			const loginFormModel = new NewLoginModel();

			const NewLoginFormView = LoginFormView.extend({
				prepareForSubmission() {
					LoginFormView.prototype.prepareForSubmission.call(this);
					loginButton.setAttribute('disabled', '');
					loginButton.textContent = 'Verifying information';
				},

				restoreFromSubmission(isSuccessful) {
					LoginFormView.prototype.restoreFromSubmission.call(this, isSuccessful);
					loginButton.removeAttribute('disabled');
					loginButton.textContent = 'Login';
				},

				success() {
					this.prepareForSubmission();

					this.model.login().then(
						() => {
							this.restoreFromSubmission(true);
							this.trigger('success');
						},
						() => {
							this.restoreFromSubmission(false);
							this.trigger('failed');
						}
					);
				}
			});

			const loginForm = new NewLoginFormView({ model: loginFormModel });

			loginForm.on('success', () => {
				this.dialogView.close();
			});

			const formViewRenderPromise = loginForm.render();

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

			this.dialogView = new DialogView({ model });
			this.dialogView.on('hidden.bs.modal', () => resolve(loginFormModel));
			const dialogViewRenderPromise = this.dialogView
				.appendTo(this.el)
				.render()
				.then(() => {
					this.dialogView.open();
				});

			return formViewRenderPromise
				.then(() => dialogViewRenderPromise)
				.then(() => BaseView.prototype.render.call(this));
		});
	},

	close() {
		if (this.dialogView) {
			this.dialogView.close();
		}
	}
});
