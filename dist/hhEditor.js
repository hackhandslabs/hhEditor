'use strict';

angular.module('hhUI', ['ui.sortable', 'firebase'])

  .directive('hhEditor', ['Settings', '$rootScope', '$firebase',
    function (Settings, $rootScope, $firebase) {
    return {
      restrict:'A',
      replace: true,
      scope: {
        session:'=session',
      },
      template: '<div class=hhEditor><div class=tabs><div id=sortable-container><div class=sortable-row as-sortable=sortableOptions ng-model=tabs><div class=onetab ng-repeat="(key, item) in tabs" as-sortable-item=""><div ng-click=focus(key) class=tabButton ng-class="{active: tabStatus.focus == key}" as-sortable-item-handle=""><div class=close ng-click="close($event, key)">x</div><div class=title>{{item.title}}{{item.syntax.ext}}</div></div></div></div></div><div class=addNew ng-click=add()>+</div></div><div class=tabsContents><div ng-repeat="(key, item) in tabs" class=tabContent ng-class="{active: tabStatus.focus == key}"><div class=editor><div hh-firepad="" tabeditor=item class=aceEditor></div></div><div class=editorStatus><div class=cursor>Line {{item.row || "1"}}, Column {{item.column || "1"}}</div><div class=syntax>Syntax:<select ng-model=item.syntax ng-change=syntax(key) ng-options="mode.name for mode in modes track by mode.name"></select></div></div></div></div></div>',
      controller: ['$scope', function($scope){

        $scope.modes = [
          { name: 'JavaScript', mode: 'ace/mode/javascript', ext:'.js'},
          { name: 'HTML5', mode:"ace/mode/html", ext:'.html' },
          { name: 'PHP', mode:"ace/mode/php", ext:'.php' },
          { name: 'C', mode:"ace/mode/c_cpp", ext:'.c' },
          { name: 'C++', mode:"ace/mode/c_cpp", ext:'.cc' },
          { name: 'Java', mode:"ace/mode/java", ext:'.java' },
          { name: 'C#', mode:"ace/mode/csharp", ext:'.cs' },
          { name: 'Scala', mode:"ace/mode/scala", ext:'.scala' },
          { name: 'CoffeeScript', mode:"ace/mode/coffee", ext:'.coffee' },
          { name: 'CSS', mode:"ace/mode/css", ext:'.css' },
          { name: 'GO', mode:"ace/mode/golang", ext:'.go' },
          { name: 'HAML', mode:"ace/mode/haml", ext:'.haml' },
          { name: 'Haskell', mode:"ace/mode/haskell", ext:'.hs' },
          { name: 'Jade', mode:"ace/mode/jade", ext:'.jade' },
          { name: 'JSON', mode:"ace/mode/json", ext:'.json' },
          { name: 'LESS', mode:"ace/mode/less", ext:'.less' },
          { name: 'Python', mode:"ace/mode/python", ext:'.py' },
          { name: 'Cython', mode:"ace/mode/python", ext:'.py' },
          { name: 'Ruby', mode:"ace/mode/ruby", ext:'.rb' },
          { name: 'Sass', mode:"ace/mode/sass", ext:'.sass' },
          { name: 'SCSS', mode:"ace/mode/scss", ext:'.scss' },
          { name: 'XML', mode:"ace/mode/xml", ext:'.xml' },
          { name: 'YAML', mode:"ace/mode/yaml", ext:'.yaml' },
          { name: 'LUA', mode:"ace/mode/lua", ext:'.lua' },
          { name: 'Markdown', mode:"ace/mode/ruby", ext:'.md' },
          { name: 'Matlab', mode:"ace/mode/matlab", ext:'.m' },
          { name: 'Objective-C', mode:"ace/mode/objectivec", ext:'.m' },
          { name: 'PERL', mode:"ace/mode/perl", ext:'.pl' },
          { name: 'SQL', mode:"ace/mode/sql", ext:'.sql' },
          { name: 'SVG', mode:"ace/mode/svg", ext:'.svg' },
          { name: 'Text', mode:"ace/mode/text", ext:'.txt' },
        ];


        var ref = new Firebase(Settings.get('FIREBASE_PATH')).child("/session/"+Settings.get('SESSION_TOKEN')+"/editor");
        $scope.tabs = $firebase(ref.child('tabs')).$asArray();
        $scope.tabStatus = $firebase(ref.child('status')).$asObject();

        $scope.syntax = function(key, syntax){
          var currentItem = $scope.tabs[key];
          $scope.tabs.$save(currentItem);
        }

        $scope.focus = function(focus){
          $scope.tabStatus.focus =  focus;
          $scope.tabStatus.$save();

          if ($scope.tabs[focus])
            window.aces[$scope.tabs[focus].id].focus()
        }

        $scope.close = function($event, tabId){
          $event.stopPropagation();

          if (tabId <= $scope.tabs.length-2)
            $scope.focus(tabId)
          else
            $scope.focus($scope.tabs.length-2)

          $scope.tabs.$remove(tabId);
        }

        $scope.add = function(){
          $scope.tabStatus.total = ($scope.tabStatus.total) ? $scope.tabStatus.total+1 : 1;
          $scope.tabStatus.$save();

          var x = $scope.tabs.$add({id: $scope.tabStatus.total, title: 'New file'+ $scope.tabStatus.total, syntax: $scope.modes[0] }).then(function(ref){
            $scope.focus($scope.tabs.length-1)
          });
        }  

        $scope.sortableOptions = {
          containment: '#sortable-container',
          //restrict move across columns. move only within column.
          accept: function (sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
          },
          orderChanged: function(diff){

            for (var i = 0; i < $scope.tabs.length; i++) {
              var currentItem = $scope.tabs[i];

              if (currentItem.$priority != i)
              {
                currentItem.$priority = i;
                $scope.tabs.$save(currentItem);
              }
            }

            $scope.focus(diff.dest.index)

          }

        };

/*
        var fnConnectedHandler = null;
        $rootScope.$broadcast('session:is_connected', function(status, session){
          if(status){
            console.log('[SessionChatCtrl] Session is already connected');
            onSessionConnected(session); return;
          }
          // If is not connected listen when it will be
          fnConnectedHandler = $rootScope.$on('session:connected', function(event, session){
            onSessionConnected(session);
          });
        });
        $scope.$on('$destroy', function(){
          console.log('[SessionChatCtrl] $destroy');
          if(fnConnectedHandler) fnConnectedHandler();
        });
*/

      }]
    }
  }])


  .directive('hhFirepad', ['Settings', function(Settings) {

    return {
      restrict: 'A',
      scope: {
        tabeditor: '='
      },
      link: function($scope, element, attrs) {

        window.aces = window.aces || {}

        var firepadDiv = element[0];
        var firepadRef = new Firebase(Settings.get('FIREBASE_PATH')).child("/session/"+Settings.get('SESSION_TOKEN')+"/editor/ace/"+$scope.tabeditor.id);

        var editor =  window.aces[$scope.tabeditor.id] = ace.edit(element[0]);
          editor.setTheme("ace/theme/monokai");
          editor.getSession().setMode("ace/mode/javascript");       

        $scope.$watch('tabeditor.syntax', function(){
          if ($scope.tabeditor.syntax)
            editor.getSession().setMode($scope.tabeditor.syntax.mode);       
        })

        // Track cursor position (for status bar)
        editor.selection.on("changeCursor", function() {
          $scope.$apply(function () {
            $scope.tabeditor.row = editor.selection.lead.row+1
            $scope.tabeditor.column = editor.selection.lead.column+1
          });
        });

        var firepad = Firepad.fromACE(firepadRef, editor);

        firepad.on('ready', function() { 
          //firepad.setText('xxxxx'+$scope.tab.id); 
        });

      }
    }

  }])