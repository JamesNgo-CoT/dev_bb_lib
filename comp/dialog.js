const DialogModel = Backbone.BaseModel.extend({
  defaults: {
    id: '',
    size: 'lg',
    heading: 'HEADING',
    body: 'BODY',
    footer: '<button class="btn btn-primary" data-dismiss="modal">Close</button>'
  }
});

const DialogView = Backbone.BaseView.extend(
  {
    attributes: {
      tabindex: '-1',
      role: 'dialog',

      'aria-hidden': 'true',
      'aria-modal': 'true'
    },

    dialog: null,
    headerTitleSpan: null,
    body: null,
    footer: null,

    events: {
      ['shown.bs.modal']() {
        this.el.querySelector('.modal-title span[tabindex="-1"]').focus();
      },

      ['hidden.bs.modal']() {
        this.trigger('hidden.bs.modal');
      }
    },

    initialize(options) {
      this.listenTo(options.model, 'change', () => {
        this.render();
      });

      Backbone.BaseView.prototype.initialize.call(this, options);
    },

    render() {
      while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild);
      }

      this.el.classList.add('modal', 'fade');

      this.el.setAttribute('aria-labelledby', `${this.id}_title`);

      this.dialog = this.el.appendChild(document.createElement('div'));
      this.dialog.classList.add('modal-dialog');
      if (this.model.has('size')) {
        this.dialog.classList.add(`modal-${this.model.get('size')}`);
      }
      this.dialog.setAttribute('role', 'document');

      const content = this.dialog.appendChild(document.createElement('div'))
      content.classList.add('modal-content');

      const header = content.appendChild(document.createElement('div'));
      header.classList.add('modal-header');

      const headerButton = header.appendChild(document.createElement('button'));
      headerButton.classList.add('close');
      headerButton.setAttribute('type', 'button');
      headerButton.setAttribute('aria-label', 'Close');
      headerButton.setAttribute('data-dismiss', 'modal');
      headerButton.innerHTML = '<span aria-hidden="true">&times;</span>';

      const headerTitle = header.appendChild(document.createElement('div'));
      headerTitle.classList.add('modal-title');
      headerTitle.setAttribute('id', `${this.id}_title`);
      headerTitle.setAttribute('role', 'heading');
      headerTitle.setAttribute('aria-level', '2');

      this.headerTitleSpan = headerTitle.appendChild(document.createElement('span'));
      this.headerTitleSpan.setAttribute('tabindex', '-1');

      const headingContent = this.model.get('heading');
      if (typeof headingContent === 'string') {
        this.headerTitleSpan.innerHTML = headingContent;
      } else if (headingContent instanceof HTMLElement) {
        this.headerTitleSpan.appendChild(headingContent);
      }

      this.body = content.appendChild(document.createElement('div'));
      this.body.classList.add('modal-body');

      const bodyContent = this.model.get('body');
      if (typeof bodyContent === 'string') {
        this.body.innerHTML = bodyContent;
      } else if (bodyContent instanceof HTMLElement) {
        this.body.appendChild(bodyContent);
      }

      this.footer = content.appendChild(document.createElement('div'));
      this.footer.classList.add('modal-footer');

      const footerContent = this.model.get('footer');
      if (typeof footerContent === 'string') {
        this.footer.innerHTML = footerContent;
      } else if (footerContent instanceof HTMLElement) {
        this.footer.appendChild(footerContent);
      }

      return Backbone.BaseView.prototype.render.call(this);
    },

    open() {
      this.$el.modal('show');
    },

    close() {
      this.$el.modal('hide');
    }
  },
  {
    singleton() {
      if (!DialogView.singletonView) {
        DialogView.singletonView = new DialogView(DialogView.singletonOptions);
        if (DialogView.singletonParent) {
          DialogView.singletonParent.appendChild(DialogView.singletonView.el);
          DialogView.singletonView.render();
        }
      }

      return DialogView.singletonView;
    },
    singletonView: null,
    singletonParent: document.body,
    singletonOptions: { model: new DialogModel() },

    showLogin(authModel) {
      return new Promise((resolve) => {
        authModel = authModel || Backbone.authModel;

        const DialogLoginFormView = LoginFormView.extend({
          className: 'loginFormView'
        });

        const loginForm = new DialogLoginFormView({ model: authModel });

        const footer = document.createElement('div');

        const loginButton = footer.appendChild(document.createElement('button'));
        loginButton.textContent = 'Login';
        loginButton.setAttribute('type', 'button');
        loginButton.classList.add('btn', 'btn-primary');

        footer.appendChild(document.createTextNode(' '));

        const cancelButton = footer.appendChild(document.createElement('button'));
        cancelButton.textContent = 'Cancel';
        cancelButton.setAttribute('type', 'button');
        cancelButton.setAttribute('data-dismiss', 'modal');
        cancelButton.classList.add('btn', 'btn-default');

        const dialogView = DialogView.singleton();
        dialogView.close();
        dialogView.model.set({
          size: 'md',
          heading: 'User Login',
          body: loginForm.el,
          footer
        });

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
          dialogView.close();
        });

        loginButton.addEventListener('click', () => {
          loginForm.el.querySelector('.btn-login').click();
        });

        dialogView.on('hidden.bs.modal', () => {
          resolve(authModel.isLoggedIn());
        });

        loginForm.render().then(() => {
          dialogView.open();
        });
      });
    }
  }
);
