/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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

foam.CLASS({
  package: 'foam.physics',
  name: 'Physical',

  constants: {
    INFINITE_MASS: 10000
  },

  properties: [
    { class: 'Float', name: 'vx', value: 0 },
    { class: 'Float', name: 'vy', value: 0 },
    {
      class: 'Float',
      name: 'velocity',
      getter: function() { return foam.math.distance(this.vx, this.vy); },
      setter: function(v) { this.setVelocityAndAngle(v, this.angleOfVelocity); }
    },
    {
      class: 'Float',
      name: 'angleOfVelocity',
      getter: function() { return Math.atan2(this.vy, this.vx); },
      setter: function(a) { this.setVelocityAndAngle(this.velocity, a); }
    },
    { class: 'Float', name: 'mass', value: 1 }
  ],

  methods: [
    function applyMomentum(m, a) {
      this.vx += (m * Math.cos(a) / this.mass);
      this.vy += (m * Math.sin(a) / this.mass);
    },

    function momentumAtAngle(a) {
      if ( this.mass == this.INFINITE_MASS ) return 0;
      var v = this.velocityAtAngle(a);
      return v * this.mass;
    },

    function velocityAtAngle(a) {
      if ( this.mass == this.INFINITE_MASS ) return 0;
      return Math.cos(a-this.angleOfVelocity) * this.velocity;
    },

    function setVelocityAndAngle(v, a) {
      this.vx = v * Math.cos(a);
      this.vy = v * Math.sin(a);
    },

    function distanceTo(other) {
      return foam.math.distance(this.x-other.x, this.y-other.y);
    }
  ]
});