if (window.cot_app) {
  const originalRender = window.cot_app.prototype.render;
  window.cot_app.prototype.render = function () {
    this.titleElement = document.createElement('span');
    this.titleElement.setAttribute('tabindex', '-1');
    document.querySelector('#app-header h1').appendChild(this.titleElement);

    return originalRender.call(this);
  };

  window.cot_app.prototype.setTitle = function (title, subTitle) {
    if (this.titleElement == null) {
      return;
    }

    this.titleElement.innerHTML = title;

    let documentTitles = [this.name];
    if (documentTitles.indexOf(title) === -1) {
      documentTitles.unshift(title);
    }
    if (subTitle != null) {
      documentTitles.unshift(subTitle);
    }

    document.title = documentTitles.filter(title => title).join(' - ');
  };
}

////////////////////////////////////////////////////////////////////////////////

if (window.cot_form) {
  const originalAddformfield = window.cot_form.prototype.addformfield;
  window.cot_form.prototype.addformfield = function (fieldDefinition, fieldContainer) {
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

  const originalValidatorOptions = window.cot_form.prototype.validatorOptions;
  window.cot_form.prototype.validatorOptions = function (fieldDefinition) {
    const returnValue = originalValidatorOptions.call(this, fieldDefinition);

    if (fieldDefinition['excluded'] != null) {
      returnValue['excluded'] = fieldDefinition['excluded'];
    }

    return returnValue;
  };
}

////////////////////////////////////////////////////////////////////////////////

if (window.CotForm) {
  const originalRender = window.CotForm.prototype.render;
  window.CotForm.prototype.render = function (...args) {
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
                renderPromises.push(renderField({ definition, section, row, field, repeatControl, repeatControlRow }));
              });
            });
          }
        });
      });

      return Promise.all(renderPromises);
    }

    function finalizeRenderer(renderer) {
      return stringToFunction(renderer);
    }

    const cotForm = this;
    const model = cotForm.getModel();
    const view = cotForm.getView();

    const definition = this._definition;

    return Promise.resolve()
      .then(() => {
        return renderLoop({
          definition,
          renderSection({ definition, section }) {
            const renderer = finalizeRenderer(section.preRender);
            if (renderer) {
              return renderer.call(this, { cotForm, model, view, definition, section });
            }
          },
          renderRow({ definition, section, row }) {
            const renderer = finalizeRenderer(row.preRender);
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
                    return ajax({ url: choices })
                      .then((data) => {
                        field.choices = data;
                      });
                  }
                }
              })
              .then(() => {
                if (field.choicesMap) {
                  field.choicesMap = stringToFunction(field.choicesMap);
                  field.choices = field.choicesMap(field.choices);
                }

                if (field.type === 'dropdown' && field.choices[0].value !== '') {
                  field.choices.unshift({ text: '- Select -', value: '' });
                }

                if (field.choices) {
                  let value;
                  if (field.value != null) {
                    value = field.value;
                  } else if (field.bindTo != null && model && model.has(field.bindTo)) {
                    value = model.get(field.bindTo);
                  }

                  if (value != null) {
                    const choices = field.choices.map(choice => choice.value != null ? choice.value : choice.text);
                    if (choices.indexOf(value) === -1) {
                      field.choices.unshift({ text: value, value });
                    }
                  }
                }

                const renderer = finalizeRenderer(field.preRender);
                if (renderer) {
                  return renderer.call(this, { cotForm, model, view, definition, section, row, field, grid, repeatControl, repeatControlRow });
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
            const renderer = finalizeRenderer(section.postRender);
            if (renderer) {
              return renderer.call(this, { cotForm, model, view, definition, section });
            }
          },
          renderRow({ definition, section, row }) {
            const renderer = finalizeRenderer(row.postRender);
            if (renderer) {
              return renderer.call(this, { cotForm, model, view, definition, section, row });
            }
          },
          renderField({ definition, section, row, field, grid, repeatControl, repeatControlRow }) {
            const renderer = finalizeRenderer(field.postRender);
            if (renderer) {
              return renderer.call(this, { cotForm, model, view, definition, section, row, field, grid, repeatControl, repeatControlRow });
            }
          }
        });
      });
  };

  window.CotForm.prototype.getModel = function () {
    return this._model;
  }

  window.CotForm.prototype.setView = function (view) {
    this._view = view;
  }

  window.CotForm.prototype.getView = function () {
    return this._view;
  }

  const originalFillFromModel = window.CotForm.prototype._fillFromModel;
  window.CotForm.prototype._fillFromModel = function (model) {
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

              index++
            }
          }
        }
      }
    }
  }
}
