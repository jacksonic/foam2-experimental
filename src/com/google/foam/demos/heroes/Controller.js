/**
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

foam.CLASS({
  package: 'com.google.foam.demos.heroes',
  name: 'Controller',
  extends: 'foam.u2.Element',

  implements: [
    'foam.mlang.Expressions'
  ],

  requires: [
    'com.google.foam.demos.heroes.CitationView',
    'com.google.foam.demos.heroes.DashboardCitationView',
    'com.google.foam.demos.heroes.Hero',
    'foam.dao.ArrayDAO',
    'foam.u2.DAOList',
    'foam.u2.DetailView',
    'foam.u2.CheckBox'
  ],

  exports: [
    'as data',
    'heroDAO',
    'editHero'
  ],

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        h2 { color: #aaa; }
        h3 {
          color: #444;
          font-size: 1.75em;
          font-weight: 100;
          margin-top: 0;
        }
        body { margin: 2em; }
        body, input[text], button { color: #888; font-family: Cambria, Georgia; }
        ^starred .foam-u2-DAOList { display: flex; }
        * { font-family: Arial; }
        input {
          font-size: 1em;
          height: 2em;
          padding-left: .4em;
        }
        ^nav .foam-u2-ActionView {
          background: #eee;
          border-radius: 4px;
          border: none;
          color: #607D8B;
          cursor: pointer; cursor: hand;
          font-height: 18px;
          font-size: 1em;
          font-weight: 500;
          margin: 0 3px;
          padding: 10px 12px;
        }
        ^nav .foam-u2-ActionView:hover {
          background-color: #cfd8dc;
        }
        ^nav .foam-u2-ActionView:disabled {
          -webkit-filter: none;
          background-color: #eee;
          color: #039be5;
          cursor: auto;
        }
      */}
    })
  ],

  properties: [
    {
      class: 'String',
      name: 'heroName',
      view: {
        class: 'foam.u2.TextField',
        onKey: true
      }
    },
    {
      name: 'heroDAO',
      view: {
        class: 'foam.u2.DAOList',
        rowView: 'com.google.foam.demos.heroes.CitationView'
      }
    },
    {
      name: 'starredHeroDAO',
      view: {
        class: 'foam.u2.DAOList',
        rowView: 'com.google.foam.demos.heroes.DashboardCitationView'
      },
      factory: function() { return this.heroDAO.where(this.EQ(this.Hero.STARRED, true)); }
    },
    {
      name: 'mode',
      value: 'dashboard'
    },
    {
      name: 'selection',
      view: { class: 'foam.u2.DetailView', title: '' }
    }
  ],

  methods: [
    function initE() {
      this.
        start('h2').add('Tour of Heroes').end().
          // TODO: start(this.HEROES) and set class
        start().cssClass(this.myCls('nav')).
          add(this.DASHBOARD, this.HEROES).
        end().
        br().
        add(this.slot(function(selection, mode) {
          return selection ? this.detailE() :
            mode === 'dashboard' ? this.dashboardE() :
            this.heroesE();
        }));
    },

    function detailE() {
      return this.E('h3').add(this.selection.name$, ' details!').br().add(this.SELECTION, this.BACK);
    },

    function dashboardE() {
      return this.E().cssClass(this.myCls('starred')).start('h3').add('Top Heroes').end().add(this.STARRED_HERO_DAO);
    },

    function heroesE() {
      return this.E().
          start('h3').
            add('My Heroes').
          end().
          start().
            add('Hero name: ', this.HERO_NAME, ' ', this.ADD_HERO).
          end().
          add(this.HERO_DAO);
    },

    function editHero(hero) {
      this.selection = hero;
    }
  ],

  actions: [
    {
      name: 'addHero',
      label: 'Add',
      isEnabled: function(heroName) { return !!heroName; },
      code: function() {
        this.heroDAO.put(this.Hero.create({name: this.heroName}));
        this.heroName = '';
      }
    },
    {
      name: 'dashboard',
      isEnabled: function(mode) { return mode != 'dashboard'; },
      code: function() { this.back(); this.mode = 'dashboard'; }
    },
    {
      name: 'heroes',
      isEnabled: function(mode) { return mode != 'heroes'; },
      code: function() { this.back(); this.mode = 'heroes'; }
    },
    {
      name: 'back',
      code: function() { this.selection = null; }
    }
  ]
});