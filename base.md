# base.js

## Utilities

- [doAjax](#doAjax)
- [escapeODataValue](#escapeODataValue)
- [loadScripts](#loadScripts)
- [stringToFunction](#stringToFunction)
- [toQueryObject](#toQueryObject)
- [toQueryString](#toQueryString)

## CoreJS

- [cot_app](#cot_app)
- [cot_form](#cot_form)
- [CotForm](#CotForm)

## BackBone

- [Backbone.sync](#Backbone.sync)
- [BaseRouter](#BaseRouter)
- [BaseModel](#BaseModel)
- [BaseCollection](#BaseCollection)
- [BaseView](#BaseView)
- [LoginModel](#LoginModel)

## doAjax

Performs an AJAX request using jQuery ajax function.

### Type

function(object) => Promise

### Arguments

1. jQuery ajax function options

### Returns

A promise that resolves with the jQuery deferred's data, textStatus and jqXHR in an object or that rejects with the the jQuery deferred's jqXHR, textStatus and errorThrown in an object.

### References

- https://api.jquery.com/jquery.ajax/

## escapeODataValue

Formats a string for oData $filter query.

### Type

function(string) => string

### Arguments

1. The string to be formatted

### Returns

A formatted string where special characters are escaped.

### Reference

- https://stackoverflow.com/questions/4229054/how-are-special-characters-handled-in-an-odata-query

## loadScripts

Loads 1 or more JavaScript resources. Each JavaScript resources, identified by its URL, will only be loaded once.

### Type

function(...string) => Promise

### Arguments

1. One or more URLs to JavaScript resource to load.

### Returns

A Promise object that is resolved when the scripts, using the script tag, has all loaded.

## stringToFunction

Turns a string into a function.

### Type

function(string|function) => function|null

### Arguments

1. The function source
   1. As string type, must contain the entire function as a string.
	2. As a function, will be returned as is.

### Returns

A valid JavaScript function or null.

## toQueryObject

Creates a object from a "query string" that was generated using [toQueryString](#toQueryString).

### Type

function(string) => object

### Arguments

1. The "query string" that was generated using [toQueryString](#toQueryString).

### Returns

A plain old JavaScript object. All of the original fields, with their original data types, are restored.

## toQueryString

### Type

function(object) => string

### Arguments

1. The data thats intended to be embedded as a query string.

### Returns

A "query string" that is safe to add to a URL as a query string.

## cot_app

Extends the original `cot_app` class to also update the document's title when ever the `setTitle` method is called. The `H1` element is also given a `tabindex` value making it focusable.

A new `titleElement` property is added after the `render` is called which points to the `H1` element allowing external code to set focus to it.

## cot_form

Extends the original cot_form class to allow `readOnly` and `excluded` field definitions.

## CotForm

Extends the original cot_form class to allow `preRender` and `postRender` form, section, rows and field definitions.

Also, `getModel`, `setView` and `getView` methods are added to complement the `setModel` method.

Lastly, string type `choices` field definitions will be treated as a URL and will download its value. `choices` without a blank value will be given one. And a new `choicesMap` field definition (type of function(object) => object) can be added to map `choices` value into a valid `choices` value

## Backbone.sync

Overrides the original `Backbone.sync`.

The new code will include common request headers, C3API Authentication when avaialble, and &ndash;when using `POST`, `PATCH` and `PUT` method&ndash; call the model's `adjustSyncJson` method to adjust data used by the `sync` function.

## BaseRouter

Extends `Backbone.Router`.

## BaseModel

Extends `Backbone.Model`.

## BaseCollection

Extends `Backbone.Collection`.

## BaseView

Extends `Backbone.View`.

## LoginModel

Extends `BaseView`.
