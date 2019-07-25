function toQueryString(queryObject) {
  if (Array.isArray(queryObject)) {
    const array = [];
    for (let index = 0, length = queryObject.length; index < length; index++) {
      array.push(encodeURIComponent(toQueryString(queryObject[index])));
    }
    return array.join(',');
  }

  if (typeof queryObject === 'object' && queryObject !== null) {
    const array = [];
    for (const key in queryObject) {
      if (Object.prototype.hasOwnProperty.call(queryObject, key)) {
        array.push(`${key}=${encodeURIComponent(toQueryString(queryObject[key]))}`);
      }
    }
    return array.join('&');
  }

  let prefix = '';
  switch (typeof queryObject) {
    case 'undefined':
      prefix = 'u';
      break;
    case 'boolean':
      prefix = 'b';
      break;
    case 'number':
      prefix = 'n';
      break;
    case 'function':
      prefix = 'f';
      break;
    case 'object':
      prefix = 'o';
      break;
    default:
      prefix = 's';
  }
  return `${prefix}${String(queryObject)}`;
}

////////////////////////////////////////////////////////////////////////////////

function toQueryObject(queryString) {
  if (typeof queryString !== 'string') {
    return queryString;
  }

  if (queryString.indexOf(',') !== -1) {
    const array = queryString.split(',');
    for (let index = 0, length = array.length; index < length; index++) {
      array[index] = toQueryObject(decodeURIComponent(array[index]));
    }
    return array;
  }

  if (queryString.indexOf('=') !== -1) {
    const object = {};
    const array = queryString.split('&');
    for (let index = 0, length = array.length; index < length; index++) {
      const pair = array[index].split('=');
      object[pair[0]] = toQueryObject(decodeURIComponent(pair[1]));
    }
    return object;
  }

  const prefix = queryString.charAt(0);
  const value = queryString.slice(1);
  switch (prefix) {
    case 'u':
      return undefined;
    case 'b':
      return Boolean(value);
    case 'n':
      return Number(value);
    case 'f':
      return (new Function(`return ${value}`))();
    case 'o':
      return null;
    default:
      return value;
  }
}

////////////////////////////////////////////////////////////////////////////////

function swapView(element, oldView, newView) {
  element.style.height = getComputedStyle(element).height;
  element.style.overflow = 'hidden';

  if (oldView) {
    oldView.remove();
  }

  Promise.resolve()
    .then(() => {
      if (newView) {
        element.appendChild(newView.el);
        return newView.render();
      }
    })
    .then(() => {
      element.style.removeProperty('overflow');
      element.style.removeProperty('height');
    });

  return newView;
}

////////////////////////////////////////////////////////////////////////////////

function escapeODataValue(str) {
  return str
    .replace(/'/g, "''")
    .replace(/%/g, "%25")
    .replace(/\+/g, "%2B")
    .replace(/\//g, "%2F")
    .replace(/\?/g, "%3F")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/\[/g, "%5B")
    .replace(/\]/g, "%5D")
    .replace(/\s/g, "%20");
}

////////////////////////////////////////////////////////////////////////////////

function stringToFunction(str) {
  if (typeof str !== 'string') {
    return str;
  }

  if (str.indexOf('function(') === 0) {
    return Function(`return ${str}`)();
  } else if (typeof window[str] === 'function') {
    return window[str];
  }

  return null;
}

////////////////////////////////////////////////////////////////////////////////

$.ajaxSetup({
  dataFilter(data) {
    return data;
  }
})

function ajax(options) {
  return new Promise((resolve, reject) => {
    $.ajax(options)
      .then((data, textStatus, jqXHR) => {
        resolve(data);
      }, (jqXHR, textStatus, errorThrown) => {
        reject(errorThrown);
      });
  });
}

////////////////////////////////////////////////////////////////////////////////

function loadScripts(...urls) {
  const promises = [];

  for (let index = 0, length = urls.length; index < length; index++) {
    const url = urls[index];

    if (document.querySelectorAll(`script[src="${url}"]`).length > 0) {
      return ;
    }

    promises.push(new Promise((resolve) => {
      var script = document.createElement('script');
      script.setAttribute('src', url);

      script.onload = () => { resolve(); };
      script.onreadystatechange = () => { resolve(); };

      document.getElementsByTagName('head')[0].appendChild(script);
    }));
  }

  return Promise.all(promises);
}
