/*
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

foam.LIB({
  name: 'foam.types.Undefined',
  methods: [
    function equals(_, b) { return b === undefined; },
    function compare(_, b) { return b === undefined ? 0 : 1; },
    function hashCode() { return -1; }
  ]
});


foam.LIB({
  name: 'foam.types.Null',
  methods: [
    function equals(_, b) { return b === null; },
    function compare(_, b) { return b === null ? 0 : b === undefined ? -1 : 1; },
    function hashCode() { return -2; }
  ]
});


foam.LIB({
  name: 'foam.types.True',
  methods: [
    function equals(_, b) { return b === true; },
    function compare(_, b) { return b ? 0 : 1; },
    function hashCode() { return 1; }
  ]
});


foam.LIB({
  name: 'foam.types.False',
  methods: [
    function equals(_, b) { return b === false; },
    function compare(_, b) { return b ? -1 : 0; },
    function hashCode() { return 0; }
  ]
});


foam.LIB({
  name: 'foam.types.Number',
  methods: [
    function equals(a, b) { return a === b; },
    function compare(a, b) { return b == null ? 1 : a < b ? -1 : a > b ? 1 : 0; },
    function hashCode(n) { return n & n; }
  ]
});


foam.LIB({
  name: 'foam.types.String',
  methods: [
    function equals(a, b) { return a === b; },
    function compare(a, b) { return b != null ? a.localeCompare(b) : 1 ; },
    function hashCode(s) {
      var hash = 0;

      for ( i = 0 ; i < s.length ; i++ ) {
        var code = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash &= hash;
      }

      return hash;
    }
  ]
});


foam.LIB({
  name: 'foam.types.Array',
  methods: [
    function equals(a, b) {
      if ( ! b || ! Array.isArray(b) || a.length !== b.length ) return false;
      for ( var i = 0 ; i < a.length ; i++ ) {
        if ( ! foam.compare.equals(a[i], b[i]) ) return false;
      }
      return true;
    },
    function compare(a, b) {
      if ( ! b || ! Array.isArray(b) ) return false;
      var l = Math.min(a.length, b.length);
      for ( var i = 0 ; i < l ; i++ ) {
        var c = foam.compare.compare(a[i], b[i]);
        if ( c ) return c;
      }
      return a.length === b.length ? true : a.length < b.length ? -1 : 1;
    },
    function hashCode(a) {
      var hash = 0;

      for ( var i = 0 ; i < a.length ; i++ ) {
        hash = ((hash << 5) - hash) + this.hashCode(a[i]);
      }

      return hash;
    }
  ]
});


foam.LIB({
  name: 'foam.types.Date',
  methods: [
    function getTime(d) { return ! d ? 0 : d.getTime ? d.getTime() : d ; },
    function equals(a, b) { return this.getTime(a) === this.getTime(b); },
    function compare(a, b) {
      a = this.getTime(a);
      b = this.getTime(b);
      return a < b ? -1 : a > b ? 1 : 0;
    },
    function hashCode(d) { var n = d.getTime(); return n & n; }
  ]
});


foam.LIB({
  name: 'foam.types.FObject',
  methods: [
    function equals(a, b) { return a.equals(b); },
    function compare(a, b) { return a.compareTo(b); },
    function hashCode(o) { return o.hashCode(); }
  ]
});


foam.LIB({
  name: 'foam.types.Object',
  methods: [
    function equals(a, b) { return a === b; },
    function compare(a, b) {
      return foam.types.Number.compare(a.$UID, b ? b.$UID : -1);
    },
    function hashCode(o) { return 0; }
  ]
});


foam.typeOf = (function() {
  var types    = foam.types,
    tNumber    = types.Number,
    tString    = types.String,
    tUndefined = types.Undefined,
    tNull      = types.Null,
    tTrue      = types.True,
    tFalse     = types.False,
    tArray     = types.Array,
    tDate      = types.Date,
    tFObject   = types.FObject,
    tObject    = types.Object;

  return function typeOf(o) {
    if ( typeof o === 'number' ) return tNumber;
    if ( typeof o === 'string' ) return tString;
    if ( o === undefined       ) return tUndefined;
    if ( o === null            ) return tNull;
    if ( o === true            ) return tTrue;
    if ( o === false           ) return tFalse;
    if ( Array.isArray(o)      ) return tArray;
    if ( o instanceof Date     ) return tDate;
    if ( foam.core.FObject.isInstance(o) ) return tFObject;
    return tObject;
  }
})();


( function() {
  var typeOf = foam.typeOf;

  foam.LIB({
    name: 'foam.compare',

    methods: [
      function equals(a, b)  { return typeOf(a).equals(a, b); },
      function compare(a, b) { return typeOf(a).compare(a, b); },
      function hashCode(o)   { return typeOf(o).hashCode(o); }
    ]
  });
} )();