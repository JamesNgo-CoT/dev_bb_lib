/* global _ $ deepCloneObject doAjax escapeODataValue loadScripts stringToFunction BaseView AlertModel AlertView */

/* exported DatatableView */
const DatatableView = BaseView.extend({

	// PROPERTIES

	attributes: { 'data-view': 'DatatableView' },

	datatableDefinition: {
		columns: [
			{
				className: 'excludeFromButtons',
				data: 'col1',
				// orderable: false,
				render(data) {
					return `<a href="#apps/${data}" class="btn btn-default">Open</a>`;
				},
				searchable: false,
				width: '57px'
			},
			{
				title: 'Column 1',
				data: 'col1'
			},
			{
				title: 'Column 2',
				data: 'col2'
			},
			{
				title: 'Column 3',
				data: 'col3'
			}
		],
		data: [
			{ col1: 'Data (1, 1)', col2: 'Data (1, 2)', col3: 'Data (1, 3)' },
			{ col1: 'Data (1, 2)', col2: 'Data (2, 2)', col3: 'Data (3, 3)' },
			{ col1: 'Data (1, 3)', col2: 'Data (2, 3)', col3: 'Data (3, 3)' }
		],
	},

	defaultDatatableDefinition: {
		dom: `<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-5'i><'col-sm-7'p>>`,
		orderCellsTop: false,
		stateSave: false,
	},

	// METHODS

	ajax(data, callback, settings) {
		if (settings.oFeatures.bServerSide) {
			const queryObject = {};

			// $count
			queryObject['$count'] = true;

			// $select
			queryObject['$select'] = data.columns
				.filter(config => typeof config.data === 'string')
				.map(config => config.data)
				.filter((select, index, array) => array.indexOf(select) === index)
				.join(',');

			// $filter
			const filters = data.columns
				.map((column, index) => {
					if (column.searchable && column.search && column.search.value && column.search.value.trim()) {
						switch (this.finalDatatableDefinition.columns[index].type) {
							case 'boolean':
							case 'number':
							case 'date':
								return `${column.data} eq ${escapeODataValue(column.search.value)}`;

							case 'function':
								return `(${stringToFunction(this.finalDatatableDefinition.columns[index].filter)(
									column,
									this.finalDatatableDefinition.columns[index]
								)})`;

							default:
								return `(${column.search.value
									.split(' ')
									.filter((value, index, array) => value && array.indexOf(value) === index)
									.map(
										value => `contains(tolower(${column.data}),'${escapeODataValue(value.toLowerCase())}')`
									)
									.join(' and ')})`;
						}
					} else {
						return false;
					}
				})
				.filter(value => value);
			if (filters.length > 0) {
				queryObject['$filter'] = filters.join(' and ');
			}

			// $orderby
			if (data.order.length > 0) {
				queryObject['$orderby'] = data.order
					.map(config => {
						let orderBy = data.columns[config.column].data;
						switch (this.finalDatatableDefinition.columns[config.column].type) {
							case 'boolean':
							case 'number':
							case 'date':
								return `${orderBy} ${config.dir}`;
							case 'function':
								return stringToFunction(this.finalDatatableDefinition.columns[config.column].orderBy)(
									config,
									orderBy,
									this.finalDatatableDefinition.columns[config.column]
								);
							default:
								return `tolower(${orderBy}) ${config.dir}`;
						}
					})
					.filter(value => value)
					.join(',');
			}

			// $search
			if (data.search && data.search.value) {
				queryObject['$search'] = data.search.value;
			}

			// $skip
			queryObject['$skip'] = data.start;

			// $top
			queryObject['$top'] = data.length;

			const queryArray = [];
			for (const key in queryObject) {
				queryArray.push(`${key}=${queryObject[key]}`);
			}

			this.ajaxFetch(queryArray.join('&'), data.draw, callback);
		} else {
			callback({ data: this.collection.toJSON() });
		}
	},

	ajaxFetch(query, draw, callback) {
		return this.collection.fetch({ query }).then(
			({ data }) => {
				callback({
					data: this.collection.toJSON(),
					draw,
					recordsTotal: data['@odata.count'],
					recordsFiltered: data['@odata.count']
				});
			},
			errorData => {
				this.ajaxFetchError(errorData, draw, callback);
			}
		);
	},

	ajaxFetchError({ jqXHR }, draw, callback) {
		const errorCode = jqXHR.status;

		let errorMessage;
		if (errorCode === 404) {
			errorMessage = 'Data not found.';
		} else {
			errorMessage =
				jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message
					? jqXHR.responseJSON.error.message
					: jqXHR.responseText;
		}

		this.showAlert(`<strong>An error has occured.</strong> Error code: ${errorCode}. Error message: ${errorMessage}`);
		callback({ data: [], draw, recordsTotal: 0, recordsFiltered: 0 });
	},

	buildTable() {
		const newTable = document.createElement('table');
		newTable.classList.add('table', 'table-bordered', 'table-striped');
		newTable.style.width = '100%';

		const thead = newTable.appendChild(document.createElement('thead'));

		const tr = thead.appendChild(document.createElement('tr'));
		const datatableDefinition = _.result(this, 'datatableDefinition');
		datatableDefinition.columns.forEach(column => {
			const th = tr.appendChild(document.createElement('th'));
			if (column.title) {
				th.textContent = column.title;
			}
		});

		return Promise.resolve(newTable);
	},

	initComplete() { },

	reload(callback, resetPaging) {
		if (this.datatable) {
			this.datatable.ajax.reload(callback, resetPaging);
		}
	},

	remove() {
		this.removeDatatable();
		return BaseView.prototype.remove.call(this);
	},

	removeDatatable() {
		if (this.datatable) {
			this.datatable.destroy();
			this.datatable = null;
		}
	},

	render() {
		this.removeDatatable();
		while (this.el.firstChild) {
			this.el.removeChild(this.el.firstChild);
		}

		let datatableDefinition = _.result(this, 'datatableDefinition');
		return Promise.resolve()
			.then(() => {
				if (typeof datatableDefinition === 'string') {
					return doAjax({ url: datatableDefinition })
						.then(({ data }) => {
							datatableDefinition = data;
						});
				}
			})
			.then(() => {
				const defaultDatatableDefinition = _.result(this, 'defaultDatatableDefinition');
				this.finalDatatableDefinition = deepCloneObject(Object.assign({}, defaultDatatableDefinition, datatableDefinition));

				if (this.finalDatatableDefinition.scripts) {
					return loadScripts(...this.finalDatatableDefinition.scripts);
				}
			})
			.then(() => {
				this.finalDatatableDefinition.buttons = _.result(this.finalDatatableDefinition, 'buttons');

				this.finalDatatableDefinition.columns.forEach(column => {
					column.render = stringToFunction(column.render);
					column.createdCell = stringToFunction(column.createdCell);
				});

				const view = this;
				this.finalDatatableDefinition.initComplete
					= this.finalDatatableDefinition.initComplete || (function (...args) {
						return view.initComplete(this.DataTable(), ...args);
					});

				this.finalDatatableDefinition.ajax
					= this.finalDatatableDefinition.ajax || ((...args) => this.ajax(...args));

				this.finalDatatableDefinition.stateSaveCallback
					= this.finalDatatableDefinition.stateSaveCallback || ((...args) => this.stateSaveCallback(...args));

				this.finalDatatableDefinition.stateLoadCallback
					= this.finalDatatableDefinition.stateLoadCallback || ((...args) => this.stateLoadCallback(...args));

				return this.buildTable().then((table) => {
					this.el.appendChild(table);
					this.datatable = $(table).DataTable(this.finalDatatableDefinition);
					return BaseView.prototype.render.call(this);
				});
			});
	},

	showAlert(message, className = 'alert-danger') {
		let parentNode = this.el;

		const model = new AlertModel({
			message
		});

		const NewAlertView = AlertView.extend({
			className: `alert ${className} alert-dismissible`
		});

		const alertView = new NewAlertView({ model });

		parentNode.insertBefore(alertView.el, parentNode.firstChild);
		alertView.render();
	},

	stateSaveCallback(settings, data) {
		const webStorage =
			_.result(this, 'webStorage') || (this.collection ? _.result(this.collection, 'webStorage') : null);
		const webStorageKey =
			_.result(this, 'webStorageKey') || (this.collection ? _.result(this.collection, 'webStorageKey') : null);

		webStorage.setItem(webStorageKey, JSON.stringify(data));
	},

	stateLoadCallback() {
		const webStorage =
			_.result(this, 'webStorage') || (this.collection ? _.result(this.collection, 'webStorage') : null);
		const webStorageKey =
			_.result(this, 'webStorageKey') || (this.collection ? _.result(this.collection, 'webStorageKey') : null);

		try {
			return JSON.parse(webStorage.getItem(webStorageKey));
		} catch (error) {
			return;
		}
	},

	webStorage: function () {
		if (this.collection) {
			return _.result(this.collection, 'webStorage') || localStorage;
		} else {
			return localStorage;
		}
	}
});

DatatableView.buttonsDatatableDefinition = {
	buttons() {
		return [
			{
				extend: 'copyHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			},
			{
				extend: 'csvHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			},
			{
				extend: 'excelHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			},
			{
				extend: 'pdfHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			},
			{
				extend: 'print',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}
		]
	},

	dom: `<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-5'i><'col-sm-7'p>>B`,

	methods: {
		doButtonsCopy() {
			this.el.querySelector('.buttons-copy').click();
		},
		doButtonsCsv() {
			this.el.querySelector('.buttons-csv').click();
		},
		doButtonsExcel() {
			this.el.querySelector('.buttons-excel').click();
		},
		doButtonsPdf() {
			this.el.querySelector('.buttons-pdf').click();
		},
		doButtonsPrint() {
			this.el.querySelector('.buttons-print').click();
		}
	}
};

////////////////////////////////////////////////////////////////////////////////

/* exported FilteredDatatableView */
const FilteredDatatableView = DatatableView.extend({

	// PROPERTY

	attributes: { 'data-view': 'FilteredDatatableView' },

	defaultDatatableDefinition: Object.assign({}, DatatableView.prototype.defaultDatatableDefinition, {
		orderCellsTop: true
	}),

	// METHODS

	buildTable() {
		return DatatableView.prototype.buildTable.call(this).then(newTable => {
			const thead = newTable.querySelector('thead');

			const tr = thead.appendChild(document.createElement('tr'));

			const promises = [];
			const datatableDefinition = _.result(this, 'datatableDefinition');
			datatableDefinition.columns.forEach((column, index) => {
				const th = tr.appendChild(document.createElement('th'));

				if (column.searchable === false) {
					return;
				}

				const title = column.title || column.data;

				if (column.choices) {
					const select = th.appendChild(document.createElement('select'));
					select.classList.add('form-control');
					select.setAttribute('aria-label', title);
					select.setAttribute('data-column-index', index);

					select.addEventListener('change', () => {
						this.datatable
							.columns(index)
							.search(select.value)
							.draw();
					});

					const option0 = select.appendChild(document.createElement('option'));
					option0.setAttribute('value', '');

					let choices = column.choices;
					const promise = Promise.resolve()
						.then(() => {
							if (Array.isArray(choices)) {
								choices = choices.slice(0);
							} else if (typeof choices === 'string') {
								option0.innerHTML = `Loading&hellip;`;
								return doAjax({
									url: choices
								}).then(({ data }) => {
									choices = data;
								});
							}
						})
						.then(() => {
							if (column.choicesMap) {
								column.choicesMap = stringToFunction(column.choicesMap);
								choices = column.choicesMap(choices);
							}

							if (choices[0].value !== '') {
								choices.unshift({
									text: '- Select -',
									value: ''
								});
							}

							select.removeChild(option0);
							choices.forEach(choice => {
								const option = select.appendChild(document.createElement('option'));
								option.textContent = choice.text || choice.value;
								option.setAttribute('value', choice.value != null ? choice.value : choice.text);
							});
						});
					promises.push(promise);
				} else {
					const input = th.appendChild(document.createElement('input'));
					input.classList.add('form-control');
					input.setAttribute('aria-label', `Filter by ${title}`);
					input.setAttribute('data-column-index', index);

					const eventHandler = () => {
						this.datatable
							.columns(index)
							.search(input.value)
							.draw();
					};

					input.addEventListener('change', eventHandler);
					input.addEventListener('keyup', eventHandler);
				}
			});

			return Promise.all(promises).then(() => {
				return newTable;
			});
		});
	},

	initComplete(datatable, settings, json) {
		DatatableView.prototype.initComplete.call(this, datatable, settings, json);

		for (let index = 0, length = datatable.columns()[0].length; index < length; index++) {
			const field = this.el.querySelector(`[data-column-index="${index}"]`);
			if (field) {
				this.el.querySelector(`[data-column-index="${index}"]`).value = datatable.column(index).search() || '';
			}
		}
	},

	resetFilters() {
		const searchCols = this.finalDatatableDefinition.searchCols || [];
		const filters = this.el.querySelectorAll(`[data-column-index]`);
		for (let index = 0, length = filters.length; index < length; index++) {
			const filter = filters[index];
			const columnIndex = filter.getAttribute('data-column-index');
			filter.value = searchCols[columnIndex] && searchCols[columnIndex].search ? searchCols[columnIndex].search : '';
			this.datatable.column(columnIndex).search(filter.value);
		}
		this.datatable.draw();
	}
});
