/*
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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

/**
  Manages a DAO's size by removing old items. Commonly applied inside a cache
  to limit the cache's size. Item freshness is tracked in a separate DAO.
  Use as a proxy to hide the removal operations.
*/
foam.CLASS({
  name: 'LRUDecoratorDAO',
  package: 'foam.dao',

  requires: [ 'foam.dao.MDAO' ],
  implements: [ 'foam.mlang.Expressions' ],

  properties: [
    {
      class: 'Int',
      name: 'maxSize',
      value: 100
    },
    {
      name: 'trackingDAO',
      factory: function() {
        return this.MDAO.create({ of: this.LRUCacheItem });
      }
    },
    {
      /** The DAO to manage. Items will be removed from this DAO as needed. */
      name: 'dao',
      postSet: function(old, nu) {
        if ( old ) {
          old.on.unsub(this.onPut);
          old.on.unsub(this.onRemove);
          old.on.unsub(this.onReset);
        }
        nu.on.sub(this.onPut);
        nu.on.sub(this.onRemove);
        nu.on.sub(this.onReset);
      }
    }
  ],

  classes: [
    {
      /** Links an object id to a last-accessed timestamp */
      name: 'LRUCacheItem',
      properties: [
        {
          name: 'id',
        },
        {
          type: 'DateTime',
          name: 'timestamp'
        }
      ]
    }
  ],

  listeners: [
    function onPut(s, on, put, obj) {
      var self = this;
      this.trackingDAO.put(
        this.LRUCacheItem.create({
          id: obj.id,
          timestamp: Date.now()
        })
      ).then(function() {
        self.cleanup();
      });
    },
    function onRemove(s, on, put, obj) {
      // ensure tracking DAO is cleaned up
      this.trackingDAO.remove(obj);
    },
    function onReset(s, on, put, obj) {
      this.trackingDAO.removeAll(obj);
    },
  ],

  methods: [
    function cleanup() {
      var self = this;
      self.trackingDAO
        .orderBy(this.DESC(self.LRUCacheItem.TIMESTAMP))
        .skip(self.maxSize)
        .select({
          put: function(obj) {
            self.dao.remove(obj);
          }
        });
    }
  ]
});
