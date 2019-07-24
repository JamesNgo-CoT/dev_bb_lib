const LoginButtonView = Backbone.BaseView.extend({
  loginFragment: 'login',

  events: {
    ['click button']() {
      this.afterRenderOnce = () => {
        this.el.querySelector('a').focus();
      };
      this.model.logout();
    }
  },

  initialize(options) {
    this.listenTo(options.model, 'change', () => {
      this.render();
    });

    Backbone.BaseModel.prototype.initialize.call(this, options);
  },

  render() {
    if (this.model.isLoggedIn()) {
      const cotUser = this.model.get('cotUser');
      const name = cotUser ? [cotUser.lastName, cotUser.firstName].filter(str => str).join(', ') : this.model.get('userID');
      this.el.innerHTML = `<button type="button" class="btn btn-default">Logout: <strong>${name}</strong></button>`;
    } else {
      const fullLoginFragment = _.result(this, 'fullLoginFragment');
      this.el.innerHTML = `<a href="#${fullLoginFragment}" class="btn btn-default">Login</a>`;
    }

    return Backbone.BaseView.prototype.render.call(this);
  },

  fullLoginFragment() {
    const loginFragment = _.result(this, 'loginFragment');
    const query = Backbone.History.started ? `?${toQueryString({ redirect: Backbone.history.getFragment() })}` : '';
    return `${loginFragment}${query}`;
  },

  hide() {
    this.el.classList.add('hide');
  },

  show() {
    this.el.classList.remove('hide');
  }
});
