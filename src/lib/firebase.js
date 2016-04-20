/*
TODO:
-better serialization/deserialization
-error handling if firebase contains malformed data, since we're not the only
ones who can write to it.
-multi part keys
*/

foam.CLASS({
  package: 'com.firebase',
  name: 'FirebaseDAO',
  extends: 'foam.dao.AbstractDAO',
  requires: [
    'foam.dao.ArraySink',
    'foam.net.HTTPRequest',
    'foam.net.EventSource'
  ],
  properties: [
    'of',
    'apppath',
    'secret',
    'eventSource_',
    {
      name: 'timestampProperty'
    },
    {
      name: 'basepath',
      expression: function(apppath, of) {
        return apppath + of.id.replace(/\./g, '/');
      }
    }
  ],
  methods: [
    function put(obj) {
      var req = this.HTTPRequest.create();

      if ( obj.id ) {
        req.method = "PUT";
        req.url = this.basepath
          + "/"
          + encodeURIComponent(obj.id) + ".json";
      } else {
        throw new Error('Server generated IDs not supported.');
        // req.method = 'POST';
        // req.url = this.basepath + '.json';
      }

      if ( this.secret ) {
        req.url += '?auth=' + encodeURIComponent(this.secret);
      }

      req.payload = JSON.stringify({
        data: foam.json.stringify(obj),
        lastUpdate: {
          ".sv": "timestamp"
        }
      });
      req.headers['content-type'] = 'application/json';
      req.headers['accept'] = 'application/json';

      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(payload) {
        payload = JSON.parse(payload);

        //        if ( obj.id ) {
          var o2 = foam.json.parse(foam.json.parseString(payload.data));
          if ( this.timestampProperty ) {
            this.timestampProperty.set(o2, payload.lastUpdate);
          }
          return o2;
        //        } else {
        //           Server created id
        //        }
      }.bind(this), function(resp) {
        // TODO: Handle various errors.
        return Promise.reject(foam.dao.InternalException.create());
      });
    },
    function remove(obj) {
      debugger;

      var req = this.HTTPRequest.create();
      req.method = "DELETE",
      req.url = this.basepath + "/" + encodeURIComponent(obj.id) + ".json";

      if ( this.secret ) {
        req.url += "?auth=" + encodeURIComponent(this.secret);
      }

      return req.send().then(function() {
        return Promise.resolve();
      }, function() {
        return Promise.reject(foam.dao.InternalException.create());
      });
    },
    function find(id) {
      var req = this.HTTPRequest.create();
      req.method = "GET";
      req.url = this.basepath + "/" + encodeURIComponent(id) + ".json";
      if ( this.secret ) {
        req.url += "?auth=" + encodeURIComponent(this.secret);
      }

      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(data) {
        if ( data == "null" ) {
          return Promise.reject(foam.dao.ObjectNotFoundException.create({ id: id }));
        }
        try {
          data = JSON.parse(data);

          var obj = foam.json.parse(
            foam.json.parseString(data.data));

          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data.lastUpdate);
          }

          return obj;
        } catch(e) {
          return Promise.reject(foam.dao.InternalException.create());
        }
      }.bind(this));
    },
    function startEvents() {
      if ( this.eventSource_ ) {
        return;
      }

      this.eventSource_ = this.EventSource.create({
        uri: this.basepath + '.json?auth=' + this.secret
      })
      this.eventSource_.message.put.sub(this.onPut);
      this.eventSource_.message.patch.sub(this.onPatch);
      this.eventSource_.start();
    },
    function stopEvents() {
      if ( this.eventSource_ ) {
        this.eventSource_.close();
        this.eventSource_.message.put.unsub(this.onPut);
        this.eventSource_.message.patch.unsub(this.onPatch);
        this.clearProperty('eventSource_');
      }
    },
    function select(sink, skip, limit, order, predicate) {
      var req = this.HTTPRequest.create();
      req.method = "GET";
      req.url = this.basepath + ".json";
      if ( this.secret ) req.url += "?auth=" + encodeURIComponent(this.secret);

      var resultSink = sink || this.ArraySink.create();
      sink = this.decorateSink_(resultSink, skip, limit, order, predicate);

      // TODO: This should be streamed for better handling of large responses.
      return req.send().then(function(resp) {
        return resp.payload;
      }).then(function(payload) {
        var data = JSON.parse(payload);
        var fc = this.FlowControl.create();

        for ( var key in data ) {
          if ( fc.stopped ) break;
          if ( fc.errorEvt ) {
            sink.error && sink.error(fc.errorEvt);
            future.set(sink);
            break;
          }

          var obj = foam.json.parse(
            foam.json.parseString(data[key].data));
          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data[key].lastUpdate);
          }

          sink.put(obj, null, fc);
        }
        sink.eof();

        return resultSink;
      }.bind(this), function(resp) {
        var e = foam.dao.InternalException.create();
        sink.error(e);
        return Promise.reject(e);
      });
    },
    function sub(firstTopic) {
      this.SUPER.apply(this, arguments);

      if ( firstTopic === 'on' ) {
        // TODO: No reliably way to detect unsubscribes yet
        // so we don't know when to stop streaming events.
        this.startEvents();
      }
    },
  ],
  listeners: [
    function onPut(s, _, _, data) {
      // PATH is one of
      // / -> new objects
      // /key -> new object
      // /key/data -> updated object

      var path = data.path;
      if ( path == "/" ) {
        // All data removed?
        if ( data.data == null ) {
          this.on.reset.pub();
          return;
        }

        for ( var key in data.data ) {
          var obj = foam.json.parse(foam.json.parseString(data.data[key].data));
          if ( this.timestampProperty ) {
            this.timestampProperty.set(obj, data.data[key].lastUpdate);
          }
          this.on.put.pub(obj);
        }
        return;
      } else if ( path.lastIndexOf('/') === 0 ) {
        if ( data.data == null ) {
          var obj = this.of.create();
          obj.id = path.substring(1)
          this.on.remove.pub(obj);
          return;
        }
        var obj = foam.json.parse(foam.json.parseString(data.data.data));
        if ( this.timestampProperty ) {
          this.timestampProperty.set(obj, data.data.lastUpdate);
        }
        this.on.put.pub(obj);
      } else if ( path.indexOf('/data') === path.length - 5 ) {
        // These last two events shouldn't happen unless somebody is editing
        // the underlying firebase data by hand.

        // Data of an existing row updated.
        debugger;
        var id = path.substring(1);
        id = id.substring(0, id.indexOf('/'));
        this.find(id).then(function(obj) {
          this.on.put.pub(obj);
        });


        // var obj = foam.json.parse(foam.json.parseString(data.data));
        // this.on.put.pub(obj);
      } else if ( path.indexOf('/lastUpdate') === path.length - 11 ) {
        // Timestamp of an existing row updated, do anything?
        // presumably if the object itself hasn't been updated we don't care
        // if it has been updated we should get an event for that.

        debugger;
        var id = path.substring(1);
        id = id.substring(0, id.indexOf('/'));
        this.find(id).then(function(obj) {
          this.on.put.pub(obj);
        });
      }
    },
    function onPatch(s, _, _, data) {
          // TODO: What does a patch even look like?
      debugger;
    }
  ]
});