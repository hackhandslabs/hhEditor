'use strict';

angular.module('hhUI', ['ui.sortable', 'firebase'])

  .directive('hhEditor', ['$firebase', function ($firebase) {
    return {
      restrict:'A E',
      replace: true,
      scope: {
        settings:'=settings',
      },
      templateUrl: 'hhEditor.html',
      controller: ['$scope', function($scope){

        // Base settings
        var settings = {
          firebase: false,
          syntax: $scope.settings.syntax || 'JavaScript',
          readOnly: $scope.settings.readOnly || false,
          initialName: $scope.settings.initialName,
          initialText: $scope.settings.initialText || '',
        }
        settings.initialSyntax = $scope.settings.initialSyntax || settings.syntax

        // Supported Ace syntax mode's
        $scope.modes = [
          { name: 'JavaScript', mode: 'ace/mode/javascript', ext:'.js'},
          { name: 'HTML', mode:"ace/mode/html", ext:'.html' },
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
          { name: 'Markdown', mode:"ace/mode/markdown", ext:'.md' },
          { name: 'Matlab', mode:"ace/mode/matlab", ext:'.m' },
          { name: 'Objective-C', mode:"ace/mode/objectivec", ext:'.m' },
          { name: 'PERL', mode:"ace/mode/perl", ext:'.pl' },
          { name: 'SQL', mode:"ace/mode/sql", ext:'.sql' },
          { name: 'SVG', mode:"ace/mode/svg", ext:'.svg' },
          { name: 'Text', mode:"ace/mode/text", ext:'.txt' },
        ];

        var getSyntax = function(name){
          var result = $scope.modes[0];
          angular.forEach($scope.modes, function(value, key) {
            if (value.name == name)
              result = value
          });
          return result;
        }

        $scope.editing = null;

        // Get default mode for new tabs
        settings.syntaxMode = getSyntax(settings.syntax);
        settings.initialSyntaxMode = getSyntax(settings.initialSyntax);

        $scope.hide = function(key){
          $scope.editing = null;
          $scope.focus(key)
        }

        $scope.clicked = function(event, key){
          if (event.which == 2)
            return $scope.close(event, key);

          if (key == $scope.tabStatus.focus)
          {
            if (settings.readOnly)
              return
            $scope.editing = key;
          }
          else
            $scope.focus(key)
        }

        $scope.downloadAll = function () {
          angular.forEach($scope.tabs, function(value, key) {
            var title = (value.title || "Untitled")+''+value.syntax.ext
            var content = window.aces[value.id].getSession().getValue();
            $scope.download(title, content)
          });
        }

        $scope.download = function (filename, text) {
          var pom = document.createElement('a');
          pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
          pom.setAttribute('download', filename);
          document.body.appendChild(pom)
          pom.click();
          document.body.removeChild(pom)
        }

        $scope.syntax = function(key, syntax){
          if (settings.readOnly)
            return

          var currentItem = $scope.tabs[key];
          $scope.tabs.$save(currentItem);
        }

        $scope.focus = function(focus){
          $scope.tabStatus.focus =  focus;
          $scope.tabStatus.$save();

          if ($scope.tabs[focus])
            window.aces[$scope.tabs[focus].id].focus()
        }

        $scope.setText = function(index, value){
          // Timeout to prevent iget errors with ng
          if ($scope.tabs[index])
            setTimeout(function(){              
              window.aces[$scope.tabs[index].id].insert(value)
            })
        }        

        $scope.close = function($event, tabId){
          $event.stopPropagation();

          if (settings.readOnly)
            return

          if (tabId <= $scope.tabs.length-2)
            $scope.focus(tabId)
          else
            $scope.focus($scope.tabs.length-2)

          $scope.tabs.$remove(tabId);
        }

        $scope.add = function(syntax, content, title){
          var syntax = syntax || settings.syntaxMode
          var content = content || ''

          $scope.tabStatus.total = ($scope.tabStatus.total) ? $scope.tabStatus.total+1 : 1;
          $scope.tabStatus.$save();
          var newTitle = title || 'New file'+ $scope.tabStatus.total

          var x = $scope.tabs.$add({id: $scope.tabStatus.total, title: newTitle, syntax: syntax, "$priority":9999 }).then(function(ref){
            
            var newTabIndex = $scope.tabs.length-1

            if (content != '')
              $scope.setText(newTabIndex, content )

            $scope.focus(newTabIndex)

          });
        }  

        // Initialize firebase connection
        var ref = new Firebase($scope.settings.firebase)
        $scope.tabStatus = $firebase(ref.child('status')).$asObject();
        $scope.tabs = $firebase(ref.child('tabs')).$asArray();
        
        //var xxx = $firebase(ref.child('tabs')).$asObject();
        $firebase(ref.child('tabs')).$asObject().$bindTo($scope, "tabsData");        

        $scope.tabs.$loaded(function(){
          if ($scope.tabs.length == 0)
            $scope.add(settings.initialSyntaxMode, settings.initialText, settings.initialName);
        });

        $scope.sortableOptions = {
          containment: '#sortable-container',
          //restrict move across columns. move only within column.
          accept: function (sourceItemHandleScope, destSortableScope) {
            if (settings.readOnly == true)
              return false

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
        }

      }]
    }
  }])

  .directive('hhFirepad', [function() {

    return {
      restrict: 'A',
      scope: {
        tabeditor: '=',
        settings: '='
      },
      link: function($scope, element, attrs) {

        var settings = {
          theme: $scope.settings.theme || "ace/theme/monokai",
          syntax: $scope.settings.editorSyntax || "ace/mode/javascript",
          readOnly: $scope.settings.readOnly || false
        }

        window.aces = window.aces || {}

        var firepadDiv = element[0];
        var firepadRef = new Firebase($scope.settings.firebase).child("firepad/"+$scope.tabeditor.id);

        var editor =  window.aces[$scope.tabeditor.id] = ace.edit(element[0]);
          editor.setTheme(settings.theme);
          editor.getSession().setMode(settings.syntax);
          editor.setReadOnly(settings.readOnly);
          editor.setShowPrintMargin(false);

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
          //firepad.setText('hello world'); 
        });

      }
    }

  }])

.directive('showFocus', ['$timeout', function($timeout) {
  return function(scope, element, attrs) {
    scope.$watch(attrs.showFocus, 
      function (newValue) { 
        $timeout(function() {
            newValue && element[0].focus();
        });
      },true);
  };    
}])

.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
})

.filter('titleDefault', function() {
  return function(input) {
    return input ? input : 'Untitled';
  };
})
