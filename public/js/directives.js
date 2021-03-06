// Generated by CoffeeScript 1.8.0
(function() {
  "use strict";
  angular.module("d2mp.directives", []).directive("modthumbnail", function() {
    return {
      templateUrl: "/partials/modThumb",
      replace: true
    };
  }).directive("gameteamstats", function() {
    return {
      templateUrl: "/partials/gameteamstats",
      replace: true
    };
  }).directive("bootTooltip", function() {
    return {
      replace: false,
      scope: {
        title: '='
      },
      link: function(scope, element, attrs) {
        var placement, tool;
        tool = attrs.bootTooltip;
        if ((tool == null) || tool === "") {
          return;
        }
        placement = attrs.placement || "left";
        element.tooltip({
          title: tool,
          placement: placement,
          container: 'body'
        });
        return element.bind('destroyed', function() {
          return $(".tooltip").remove();
        });
      }
    };
  }).directive("inlineteams", function() {
    return {
      templateUrl: "/partials/inlineteams",
      replace: true
    };
  }).directive("customsort", function() {
    return {
      restrict: 'A',
      transclude: true,
      scope: {
        order: '=',
        sort: '='
      },
      templateUrl: "/partials/lobbylistheader",
      link: function(scope) {
        scope.sort_by = function(newOrder) {
          var sort;
          sort = scope.sort;
          sort.reverse = sort.order === newOrder ? !sort.reverse : false;
          return sort.order = newOrder;
        };
        return scope.selectedCls = function(column) {
          var sort;
          sort = scope.sort;
          if (column === sort.order) {
            if (sort.reverse) {
              return 'fa-sort-down';
            } else {
              return 'fa-sort-up';
            }
          } else {
            return 'fa-sort';
          }
        };
      }
    };
  });

}).call(this);
