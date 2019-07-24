const FormView = Backbone.BaseView.extend(
  {
    render() {
      while (this.el.firstChild) {
        this.removeChild(this.el.firstChild);
      }

      const formDefinition = _.result(this, 'formDefinition');
      formDefinition.id = _.result(formDefinition, 'id') || FormView.uniqueId();
      formDefinition.rootPath = _.result(formDefinition, 'rootPath') || _.result(this, 'rootPath');
      formDefinition.useBinding = true;

      formDefinition.success = formDefinition.success || ((event) => {
        event.preventDefault();
        this.success();
        return false;
      });

      this.cotForm = new CotForm(formDefinition);
      this.cotForm.setModel(this.model);
      this.cotForm.setView(this);

      return Promise.resolve()
        .then(() => {
          return this.cotForm.render({ target: this.el });
        })
        .then(() => {
          this.form = this.el.querySelector('form');
          this.formValidator = $(this.form).data('formValidation');

          return Backbone.BaseView.prototype.render.call(this);
        });
    },

    success() {
      this.trigger('success');
    },

    showAlert(message, sectionIndex) {
      let parentNode = this.form;

      if (sectionIndex != null) {
        parentNode = parentNode.querySelectorAll('.panel-body')[sectionIndex];
      }

      const model = new AlertModel({ message });
      const alertView = new AlertView({ model });
      parentNode.insertBefore(alertView.el, parentNode.firstChild);
      alertView.render();
    }
  },
  {
    uniqueId() {
      if (FormView._uniqueId == null) {
        FormView._uniqueId = 0;
      }

      return `FormView_${FormView._uniqueId++}`;
    }
  }
);
