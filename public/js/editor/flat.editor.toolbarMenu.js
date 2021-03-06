angular.module('flat.editor.toolbarMenu', []).
directive('toolbarMenu', function () {
  return {
    templateUrl: '/views/editor/_toolbarMenu.html',
    controller: ['$rootScope', '$scope', '$timeout', '$element', 'toolbarAction',
    function ($rootScope, $scope, $timeout, $element, toolbarAction) {
      $scope.active = {};
      $scope.tools = {
        l01_clef: {
          title: 'Clefs',
          position: 'left',
          class: 'flat-iconf-treble',
          type: 'clef',
          svgHeight: '70', svgWidth: '50',
          subs: [
            { title: 'Treble clef', svg: '/dist/img/icons/treble_clef.svg' },
            { title: 'Bartione C clef Mezzo-soprano', svg: '/dist/img/icons/baritone_c_clef.svg' },
            { title: 'Tenor clef', svg: '/dist/img/icons/tenor_clef.svg' },
            { title: 'Alto clef', svg: '/dist/img/icons/alto_clef.svg' },
            { title: 'Clef Mezzo-soprano', svg: '/dist/img/icons/mezzosoprano_clef.svg' },
            { title: 'Clef Soprano', svg: '/dist/img/icons/soprano_clef.svg' },
            { title: 'Clef bass', svg: '/dist/img/icons/bass_clef.svg'  }
          ],
        },
        l02_keySignature: {
          title: 'Keys Signatures',
          position: 'left',
          class: 'unicode-icon-sharp',
          type: 'keySignature',
          svgHeight: '70', svgWidth: '70',
          subs: [
            { title: 'Cb Major / Ab Minor', svg: '/dist/img/icons/7b-C-flat-major_a-flat-minor.svg'},
            { title: 'Gb Major / Eb Minor', svg: '/dist/img/icons/6b-G-flat-major_e-flat-minor.svg'},
            { title: 'Db Major / Bb Minor', svg: '/dist/img/icons/5b-D-flat-major_b-flat-minor.svg'},
            { title: 'Ab Major / F Minor', svg: '/dist/img/icons/4b-A-flat-major_f-minor.svg'},
            { title: 'Eb Major / C Minor', svg: '/dist/img/icons/3b-E-flat-major_c-minor.svg'},
            { title: 'Bb Major / G Minor', svg: '/dist/img/icons/2b-B-flat-major_g-minor.svg'},
            { title: 'F Major / D Minor', svg: '/dist/img/icons/1b-F-major_d-minor.svg'},
            { title: 'C Major / A Minor', svg: '/dist/img/icons/0-C-major_a-minor.svg'},
            { title: 'G Major / E Minor', svg: '/dist/img/icons/1s-G-major_e-minor.svg'},
            { title: 'D Major / B Minor', svg: '/dist/img/icons/2s-D-major_h-minor.svg'},
            { title: 'A Major / F# Minor', svg: '/dist/img/icons/3s-A-major_f-sharp-minor.svg'},
            { title: 'E Major / C# Minor', svg: '/dist/img/icons/4s-E-major_c-sharp-minor.svg'},
            { title: 'B Major / G# Minor', svg: '/dist/img/icons/5s-B-major_g-sharp-minor.svg'},
            { title: 'F# Major / D# Minor', svg: '/dist/img/icons/6s-F-sharp-major_d-sharp-minor.svg'},
            { title: 'C# Major / A# Minor', svg: '/dist/img/icons/7s-C-sharp-major_a-sharp-minor.svg'},
          ]
        },
        l03_note: {
          title: 'Note',
          position: 'left',
          class: 'unicode-icon-eighth',
          mode: 'active',
          action: 'noteType',
          type: 'note',
          svgHeight: '70', svgWidth: '70',
          subs: [
            // { title: 'Double whole', svg: '/dist/img/icons/note_doublewhole.svg', value: null },
            { title: 'Whole', svg: '/dist/img/icons/note_whole.svg', value: 1 },
            { title: 'Half', svg: '/dist/img/icons/note_half.svg', value: 2 },
            { title: 'Quarter', svg: '/dist/img/icons/note_quarter.svg', value: 3 },
            { title: 'Eighth', svg: '/dist/img/icons/note_eighth.svg', value: 4 },
            { title: 'Sixteenth', svg: '/dist/img/icons/note_sixteenth.svg', value: 5 },
            { title: 'Thirtysecondnote', svg: '/dist/img/icons/note_thirtysecondnote.svg', value: 6 },
            { title: 'Sixtyfourth', svg: '/dist/img/icons/note_sixtyfourth.svg', value: 7 },
          ]
        },
        l04_player: {
          title: 'Player',
          position: 'left',
          class: 'glyphicon glyphicon-headphones',
          action: 'player',
          subs: [
            { title: 'Play', class: 'glyphicon glyphicon-play', value: true },
            { title: 'Stop', class: 'glyphicon glyphicon-stop', value: false }
          ]
        },
        r01_history: {
          title: 'History',
          position: 'right',
          class: 'glyphicon glyphicon-tasks',
          action: 'history'
        },
        r02_save: {
          title: 'Save',
          position: 'right',
          class: 'glyphicon glyphicon-hdd',
          action: 'save',
          mode: 'hide'
        },
      };

      $scope.show = function (k, e) {
        $scope.tools[k].displayed = !$scope.tools[k].displayed;
        $timeout(function () {
          $scope.tools[k].styles = {};
          if ($scope.tools[k].displayed) {
            var minWidth = $('.toolbar-top .second #tb-' + k).width() + 2;
            $scope.tools[k].styles['min-width'] = minWidth < 60 ? 60 : minWidth;
          }
          else {
            $scope.tools[k].styles['min-width'] = 'auto';
          }
        }, 0);

        if ($scope.tools[k].mode === 'active') {
          // TODO disable active tools
        }
      };

      $scope.action = function (t, s) {
        var action = s.action || t.action || t,
            type = s.type || t.type,
            value = s.value || t.value;

        if (t.mode === 'active') {
          if ($scope.active[type] === value || typeof(value) === null) {
            $scope.active[type] = null;
          }
          else {
            $scope.active[type] = value;
          }

          toolbarAction[action]($scope.active[type]);
        }
        else {
          toolbarAction[action](value, $scope);
        }
      };

      $scope.isActive = function (t, s) {
        return t.mode === 'active' &&
               $scope.active[s.type || t.type] === (s.value || t.value);
      };
    }]
  };
}).
directive('toolbarSvg', ['$http', function ($http) {
  var svgLoader;
  return {
    restrict: 'A',
    scope: {
      svg: '=toolbarSvg',
      width: '=svgWidth',
      height: '=svgHeight'
    },
    template: '<div>{{ svg }}</div>',
    replace: true,
    link: function postLink($scope, $element, $attrs) {
      $scope.$watch('svg', function (url) {
        if (!url || url.length === 0) {
          return;
        }

        svgLoader = $http.get(url).success(function (svg) {
          var $svg = $element.html(svg).find('svg');
          // Because jQuery sucks
          $svg[0].setAttribute(
            'viewBox', '0 0 ' + $svg.attr('width') + ' ' + $svg.attr('height')
          );
          $svg[0].setAttribute('height', $scope.height);
          $svg[0].setAttribute('width', $scope.width);
        });
      });
    }
  };
}]).
service('toolbarAction', ['$rootScope', 'Socket', function ($rootScope, Socket) {
  this.noteType = function (type) {
    if (type === null) {
      $rootScope.Interac.ActionFocus = null;
    }
    else {
      $rootScope.Interac.ActionFocus = function (data, pos, line, RealTime) {
        RealTime.edit.addNote(pos.nbPart, pos.nbMeasure, pos.nbTick, line, type -1, pos.nbVoice);
        // data.addNote(pos.nbPart, pos.nbMeasure, pos.nbTick, line, type -1, pos.nbVoice);
      };
    }
  };

  this.player = function (play) {
    $rootScope.player = $rootScope.player || new Flat.Player($rootScope.data['score']['score-partwise']['part']);
    console.log('player', play);
    if (play) {
        $rootScope.player.reset();
        $rootScope.player.render();   
        $rootScope.player.play();
    }
    else {
      $rootScope.player.stop();
    }
  };

  this.save = function (value, $scope) {
    Socket.emit('save', $scope.saveComment);
    $scope.show('r02_save');
    $scope.saveComment = '';
  };
}]);