
/**
  @ngdoc module
  @name wk.chart
  @module wk.chart
  @description
  wk-charts module - beautiful charts defined through HTML markup, based on AngularJs
  -----------------------------------------------------------------------------------

  ** wide range of charts
  ** nicely animated
  ** implemented as AngularJs Directives  -> defined as markup
  ** Angular data binding for data an chart attributes
 */
angular.module('wk.chart', []);


/**
   lists the ordinal scale objects,
 */

angular.module('wk.chart').constant('d3OrdinalScales', ['ordinal', 'category10', 'category20', 'category20b', 'category20c']);


/**
  Sets the default margins and paddings for the chart layout
 */

angular.module('wk.chart').constant('wkChartMargins', {
  top: 10,
  left: 50,
  bottom: 40,
  right: 20,
  topBottomMargin: {
    axis: 25,
    label: 18
  },
  leftRightMargin: {
    axis: 40,
    label: 20
  },
  minMargin: 8,
  "default": {
    top: 8,
    left: 8,
    bottom: 8,
    right: 10
  },
  axis: {
    top: 25,
    bottom: 25,
    left: 40,
    right: 40
  },
  label: {
    top: 18,
    bottom: 18,
    left: 20,
    right: 20
  },
  dataLabelPadding: {
    hor: 5,
    vert: 5
  }
});

angular.module('wk.chart').constant('d3Shapes', ['circle', 'cross', 'triangle-down', 'triangle-up', 'square', 'diamond']);

angular.module('wk.chart').constant('axisConfig', {
  labelFontSize: '1.6em',
  x: {
    axisPositions: ['top', 'bottom'],
    axisOffset: {
      bottom: 'height'
    },
    axisPositionDefault: 'bottom',
    direction: 'horizontal',
    measure: 'width',
    labelPositions: ['outside', 'inside'],
    labelPositionDefault: 'outside',
    labelOffset: {
      top: '1em',
      bottom: '-0.8em'
    }
  },
  y: {
    axisPositions: ['left', 'right'],
    axisOffset: {
      right: 'width'
    },
    axisPositionDefault: 'left',
    direction: 'vertical',
    measure: 'height',
    labelPositions: ['outside', 'inside'],
    labelPositionDefault: 'outside',
    labelOffset: {
      left: '1.2em',
      right: '1.2em'
    }
  }
});

angular.module('wk.chart').constant('d3Animation', {
  duration: 500
});

angular.module('wk.chart').constant('templateDir', 'templates/');

angular.module('wk.chart').constant('formatDefaults', {
  date: '%x',
  number: ',.2f'
});

angular.module('wk.chart').constant('barConfig', {
  padding: 0.1,
  outerPadding: 0
});

// Copyright (c) 2013, Jason Davies, http://www.jasondavies.com
// See LICENSE.txt for details.
(function() {

var radians = Math.PI / 180,
    degrees = 180 / Math.PI;

// TODO make incremental rotate optional

d3.geo.zoom = function() {
  var projection,
      zoomPoint,
      event = d3.dispatch("zoomstart", "zoom", "zoomend"),
      zoom = d3.behavior.zoom()
        .on("zoomstart", function() {
          var mouse0 = d3.mouse(this),
              rotate = quaternionFromEuler(projection.rotate()),
              point = position(projection, mouse0);
          if (point) zoomPoint = point;

          zoomOn.call(zoom, "zoom", function() {
                projection.scale(d3.event.scale);
                var mouse1 = d3.mouse(this),
                    between = rotateBetween(zoomPoint, position(projection, mouse1));
                projection.rotate(eulerFromQuaternion(rotate = between
                    ? multiply(rotate, between)
                    : multiply(bank(projection, mouse0, mouse1), rotate)));
                mouse0 = mouse1;
                event.zoom.apply(this, arguments);
              });
          event.zoomstart.apply(this, arguments);
        })
        .on("zoomend", function() {
          zoomOn.call(zoom, "zoom", null);
          event.zoomend.apply(this, arguments);
        }),
      zoomOn = zoom.on;

  zoom.projection = function(_) {
    return arguments.length ? zoom.scale((projection = _).scale()) : projection;
  };

  return d3.rebind(zoom, event, "on");
};

function bank(projection, p0, p1) {
  var t = projection.translate(),
      angle = Math.atan2(p0[1] - t[1], p0[0] - t[0]) - Math.atan2(p1[1] - t[1], p1[0] - t[0]);
  return [Math.cos(angle / 2), 0, 0, Math.sin(angle / 2)];
}

function position(projection, point) {
  var t = projection.translate(),
      spherical = projection.invert(point);
  return spherical && isFinite(spherical[0]) && isFinite(spherical[1]) && cartesian(spherical);
}

function quaternionFromEuler(euler) {
  var λ = .5 * euler[0] * radians,
      φ = .5 * euler[1] * radians,
      γ = .5 * euler[2] * radians,
      sinλ = Math.sin(λ), cosλ = Math.cos(λ),
      sinφ = Math.sin(φ), cosφ = Math.cos(φ),
      sinγ = Math.sin(γ), cosγ = Math.cos(γ);
  return [
    cosλ * cosφ * cosγ + sinλ * sinφ * sinγ,
    sinλ * cosφ * cosγ - cosλ * sinφ * sinγ,
    cosλ * sinφ * cosγ + sinλ * cosφ * sinγ,
    cosλ * cosφ * sinγ - sinλ * sinφ * cosγ
  ];
}

function multiply(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
      b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  return [
    a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
    a0 * b1 + a1 * b0 + a2 * b3 - a3 * b2,
    a0 * b2 - a1 * b3 + a2 * b0 + a3 * b1,
    a0 * b3 + a1 * b2 - a2 * b1 + a3 * b0
  ];
}

function rotateBetween(a, b) {
  if (!a || !b) return;
  var axis = cross(a, b),
      norm = Math.sqrt(dot(axis, axis)),
      halfγ = .5 * Math.acos(Math.max(-1, Math.min(1, dot(a, b)))),
      k = Math.sin(halfγ) / norm;
  return norm && [Math.cos(halfγ), axis[2] * k, -axis[1] * k, axis[0] * k];
}

function eulerFromQuaternion(q) {
  return [
    Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees,
    Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
    Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
  ];
}

function cartesian(spherical) {
  var λ = spherical[0] * radians,
      φ = spherical[1] * radians,
      cosφ = Math.cos(φ);
  return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
  ];
}

function dot(a, b) {
  for (var i = 0, n = a.length, s = 0; i < n; ++i) s += a[i] * b[i];
  return s;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

})();


/**
  @ngdoc behavior
  @name brush
  @module wk.chart
  @restrict A
  @element x, y, range-x, range-y or layout
  @description

  enable brushing behavior
 */

/**
  @ngdoc attr
  @name brush#brush
  @values none
  @param brush {string} Brush name
  Brush will be published under this name for consumption by other layouts
 */
angular.module('wk.chart').directive('brush', function($log, selectionSharing, behavior) {
  return {
    restrict: 'A',
    require: ['^chart', '^layout', '?x', '?y', '?rangeX', '?rangeY'],
    scope: {

      /**
        @ngdoc attr
        @name brush#brushExtent
        @param brushExtent {array} Contains the start and end index into the data array for the brushed axis. Is undefined if brush is empty or is a xy (layout) brush
       */
      brushExtent: '=',

      /**
        @ngdoc attr
        @name brush#selectedValues
        @param selectedValues {array} Contains array of the axis values of the selected the brush  area. Is undefined if brush is empty or is xy (layout) brushes
       */
      selectedValues: '=',

      /**
        @ngdoc attr
        @name brush#selectedDomain
        @param selectedDomain {array} Contains an array of data objects for the selected brush area.
       */
      selectedDomain: '=',

      /**
        @ngdoc attr
        @name brush#selectedDomainChange
        @param selectedDomainChange {expression} expression to evaluate upon a change of the brushes selected domain. The selected domain is available as ´domain´
       */
      selectedDomainChange: '&',

      /**
        @ngdoc attr
        @name brush#brushStart
        @param brushStart {expression} expression to evaluate upon a start of brushing. Is fired on 'mousedown'.
       */
      brushStart: '&',

      /**
        @ngdoc attr
        @name brush#brushEnd
        @param brushEnd {expression} expression to evaluate upon a end of brushing. is fired on 'mouseup'. The selected domain is available as ´domain´
       */
      brushEnd: '&',

      /**
        @ngdoc attr
        @name brush#clearBrush
        @param clearBrush {function} assigns a function that clears the brush selection when called via a bound scope variable.
        * Usage: bind a scope variable to the attribute: `clear-selection="scopeVar"`. `brush` assigns a function to scopeVar that can be called to reset the brush, e.g. in a button: `<button ng-click="scopeVar()">Clear Brush</button>`
       */
      clearBrush: "="
    },
    link: function(scope, element, attrs, controllers) {
      var brush, chart, layout, rangeX, rangeY, scales, x, xScale, y, yScale, _brushAreaSelection, _brushGroup, _isAreaBrush, _ref, _ref1, _ref2, _ref3, _ref4, _selectables;
      chart = controllers[0].me;
      layout = (_ref = controllers[1]) != null ? _ref.me : void 0;
      x = (_ref1 = controllers[2]) != null ? _ref1.me : void 0;
      y = (_ref2 = controllers[3]) != null ? _ref2.me : void 0;
      rangeX = (_ref3 = controllers[4]) != null ? _ref3.me : void 0;
      rangeY = (_ref4 = controllers[5]) != null ? _ref4.me : void 0;
      xScale = void 0;
      yScale = void 0;
      _selectables = void 0;
      _brushAreaSelection = void 0;
      _isAreaBrush = !x && !y;
      _brushGroup = void 0;
      brush = chart.behavior().brush;
      if (!x && !y && !rangeX && !rangeY) {
        scales = layout.scales().getScales(['x', 'y']);
        brush.x(scales.x);
        brush.y(scales.y);
      } else {
        brush.x(x || rangeX);
        brush.y(y || rangeY);
      }
      brush.active(true);
      scope.$watch('clearBrush', function(val) {
        if (attrs.clearBrush) {
          return scope.clearBrush = brush.clearBrush;
        }
      });
      attrs.$observe('brush', function(val) {
        if (_.isString(val) && val.length > 0) {
          return brush.brushGroup(val);
        } else {
          return brush.brushGroup(void 0);
        }
      });
      brush.events().on('brushStart', function() {
        scope.brushStart();
        return scope.$apply();
      });
      brush.events().on('brush', function(idxRange, valueRange, domain) {
        if (attrs.brushExtent) {
          scope.brushExtent = idxRange;
        }
        if (attrs.selectedValues) {
          scope.selectedValues = valueRange;
        }
        if (attrs.selectedDomain) {
          scope.selectedDomain = domain;
        }
        scope.selectedDomainChange({
          domain: domain
        });
        return scope.$apply();
      });
      brush.events().on('brushEnd', function(idxRange, valueRange, domain) {
        scope.brushEnd({
          domain: domain
        });
        return scope.$apply();
      });
      return layout.lifeCycle().on('drawChart.brush', function(data) {
        return brush.data(data);
      });
    }
  };
});

angular.module("wk.chart").run(["$templateCache", function($templateCache) {$templateCache.put("templates/legend.html","\n<div ng-style=\"position\" ng-show=\"showLegend\" class=\"wk-chart-legend\">\n  <div ng-show=\"title\" class=\"legend-title\">{{title}}</div>\n  <ul class=\"list-unstyled\">\n    <li ng-repeat=\"legendRow in legendRows track by legendRow.value\" class=\"wk-chart-legend-item\"><span ng-if=\"legendRow.color\" ng-style=\"legendRow.color\">&nbsp;&nbsp;&nbsp;</span>\n      <svg-icon ng-if=\"legendRow.path\" path=\"legendRow.path\" width=\"20\"></svg-icon><span> &nbsp;{{legendRow.value}}</span>\n    </li>\n  </ul>\n</div>");
$templateCache.put("templates/toolTip.html","\n<div ng-style=\"position\" class=\"wk-chart-tooltip\">\n  <table class=\"table table-condensed table-bordered\">\n    <thead ng-show=\"headerValue\">\n      <tr>\n        <th colspan=\"2\">{{headerName}}</th>\n        <th>{{headerValue}}</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr ng-repeat=\"ttRow in layers track by ttRow.name\">\n        <td ng-style=\"ttRow.color\" ng-class=\"ttRow.class\">\n          <svg-icon ng-if=\"ttRow.path\" path=\"ttRow.path\" width=\"15\"></svg-icon>\n        </td>\n        <td>{{ttRow.name}}</td>\n        <td>{{ttRow.value}}</td>\n      </tr>\n    </tbody>\n  </table>\n</div>");}]);
/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */

(function() {
    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    this.ResizeSensor = function(element, callback) {
        /**
         *
         * @constructor
         */
        function EventQueue() {
            this.q = [];
            this.add = function(ev) {
                this.q.push(ev);
            };
            var i, j;
            this.call = function() {
                for (i = 0, j = this.q.length; i < j; i++) {
                    this.q[i].call();
                }
            };
        }
        /**
         * @param {HTMLElement} element
         * @param {String} prop
         * @returns {String|Number}
         */
        function getComputedStyle(element, prop) {
            if (element.currentStyle) {
                return element.currentStyle[prop];
            } else if (window.getComputedStyle) {
                return window.getComputedStyle(element, null).getPropertyValue(prop);
            } else {
                return element.style[prop];
            }
        }
        /**
         *
         * @param {HTMLElement} element
         * @param {Function} resized
         */
        function attachResizeEvent(element, resized) {
            if (!element.resizedAttached) {
                element.resizedAttached = new EventQueue();
                element.resizedAttached.add(resized);
            } else if (element.resizedAttached) {
                element.resizedAttached.add(resized);
                return;
            }
            element.resizeSensor = document.createElement('div');
            element.resizeSensor.className = 'wk-chart-resize-sensor';
            var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: scroll; z-index: -1; visibility: hidden;';
            var styleChild = 'position: absolute; left: 0; top: 0;';
            element.resizeSensor.style.cssText = style;
            element.resizeSensor.innerHTML =
                '<div class="wk-chart-resize-sensor-expand" style="' + style + '">' +
                '<div style="' + styleChild + '"></div>' +
                '</div>' +
                '<div class="wk-chart-resize-sensor-shrink" style="' + style + '">' +
                '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
                '</div>';
            element.appendChild(element.resizeSensor);
            if (!{fixed: 1, absolute: 1}[getComputedStyle(element, 'position')]) {
                element.style.position = 'relative';
            }
            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var shrinkChild = shrink.childNodes[0];
            var lastWidth, lastHeight;
            var reset = function() {
                expandChild.style.width = expand.offsetWidth + 10 + 'px';
                expandChild.style.height = expand.offsetHeight + 10 + 'px';
                expand.scrollLeft = expand.scrollWidth;
                expand.scrollTop = expand.scrollHeight;
                shrink.scrollLeft = shrink.scrollWidth;
                shrink.scrollTop = shrink.scrollHeight;
                lastWidth = element.offsetWidth;
                lastHeight = element.offsetHeight;
            };
            reset();
            var changed = function() {
                element.resizedAttached.call();
            };
            var addEvent = function(el, name, cb) {
                if (el.attachEvent) {
                    el.attachEvent('on' + name, cb);
                } else {
                    el.addEventListener(name, cb);
                }
            };
            addEvent(expand, 'scroll', function() {
                if (element.offsetWidth > lastWidth || element.offsetHeight > lastHeight) {
                    changed();
                }
                reset();
            });
            addEvent(shrink, 'scroll',function() {
                if (element.offsetWidth < lastWidth || element.offsetHeight < lastHeight) {
                    changed();
                }
                reset();
            });
        }
        if ("[object Array]" === Object.prototype.toString.call(element)
            || ('undefined' !== typeof jQuery && element instanceof jQuery) //jquery
            || ('undefined' !== typeof Elements && element instanceof Elements) //mootools
            ) {
            var i = 0, j = element.length;
            for (; i < j; i++) {
                attachResizeEvent(element[i], callback);
            }
        } else {
            attachResizeEvent(element, callback);
        }
    }
})()

/**
  @ngdoc behavior
  @name brushed
  @module wk.chart
  @restrict A
  @description

  enables an axis to be scaled by a named brush in a different layout
 */
angular.module('wk.chart').directive('brushed', function($log, selectionSharing, timing) {
  var sBrushCnt;
  sBrushCnt = 0;
  return {
    restrict: 'A',
    require: ['^chart', '?^layout', '?x', '?y', '?rangeX', '?rangeY'],
    link: function(scope, element, attrs, controllers) {
      var axis, brusher, chart, layout, rangeX, rangeY, x, y, _brushGroup, _ref, _ref1, _ref2, _ref3, _ref4;
      chart = controllers[0].me;
      layout = (_ref = controllers[1]) != null ? _ref.me : void 0;
      x = (_ref1 = controllers[2]) != null ? _ref1.me : void 0;
      y = (_ref2 = controllers[3]) != null ? _ref2.me : void 0;
      rangeX = (_ref3 = controllers[4]) != null ? _ref3.me : void 0;
      rangeY = (_ref4 = controllers[5]) != null ? _ref4.me : void 0;
      axis = x || y || rangeX || rangeY;
      _brushGroup = void 0;
      brusher = function(extent, idxRange) {
        var l, _i, _len, _ref5, _results;
        if (!axis) {
          return;
        }
        if (extent.length > 0) {
          axis.domain(extent).scale().domain(extent);
        } else {
          axis.domain(void 0);
          axis.scale().domain(axis.getDomain(chart.getData()));
          if (axis.isOrdinal()) {
            idxRange = [0, axis.scale().domain().length - 1];
          }
        }
        _ref5 = chart.layouts();
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          l = _ref5[_i];
          if (l.scales().hasScale(axis)) {
            _results.push(l.lifeCycle().brush(axis, true, idxRange));
          }
        }
        return _results;
      };
      attrs.$observe('brushed', function(val) {
        if (_.isString(val) && val.length > 0) {
          _brushGroup = val;
          return selectionSharing.register(_brushGroup, brusher);
        } else {
          return _brushGroup = void 0;
        }
      });
      return scope.$on('$destroy', function() {
        return selectionSharing.unregister(_brushGroup, brusher);
      });
    }
  };
});

(function() {
    var out$ = typeof exports != 'undefined' && exports || this;

    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    function inlineImages(callback) {
        var images = document.querySelectorAll('svg image');
        var left = images.length;
        if (left == 0) {
            callback();
        }
        for (var i = 0; i < images.length; i++) {
            (function(image) {
                if (image.getAttribute('xlink:href')) {
                    var href = image.getAttribute('xlink:href').value;
                    if (/^http/.test(href) && !(new RegExp('^' + window.location.host).test(href))) {
                        throw new Error("Cannot render embedded images linking to external hosts.");
                    }
                }
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var img = new Image();
                img.src = image.getAttribute('xlink:href');
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    image.setAttribute('xlink:href', canvas.toDataURL('image/png'));
                    left--;
                    if (left == 0) {
                        callback();
                    }
                }
            })(images[i]);
        }
    }

    function styles(dom) {
        var css = "";
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            var rules = sheets[i].cssRules;
            if (rules != null) {
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (typeof(rule.style) != "undefined") {
                        css += rule.selectorText + " { " + rule.style.cssText + " }\n";
                    }
                }
            }
        }

        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.innerHTML = "<![CDATA[\n" + css + "\n]]>";

        var defs = document.createElement('defs');
        defs.appendChild(s);
        return defs;
    }

    out$.svgAsDataUri = function(el, scaleFactor, cb) {
        scaleFactor = scaleFactor || 1;

        inlineImages(function() {
            var outer = document.createElement("div");
            var clone = el.cloneNode(true);
            var width = parseInt(
                clone.getAttribute('width')
                || clone.style.width
                || out$.getComputedStyle(el).getPropertyValue('width')
            );
            var height = parseInt(
                clone.getAttribute('height')
                || clone.style.height
                || out$.getComputedStyle(el).getPropertyValue('height')
            );

            var xmlns = "http://www.w3.org/2000/xmlns/";

            clone.setAttribute("version", "1.1");
            clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
            clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
            clone.setAttribute("width", width * scaleFactor);
            clone.setAttribute("height", height * scaleFactor);
            clone.setAttribute("viewBox", "0 0 " + width + " " + height);
            outer.appendChild(clone);

            clone.insertBefore(styles(clone), clone.firstChild);

            var svg = doctype + outer.innerHTML;
            var uri = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
            if (cb) {
                cb(uri);
            }
        });
    }

    out$.saveSvgAsPng = function(el, name, scaleFactor) {
        out$.svgAsDataUri(el, scaleFactor, function(uri) {
            var image = new Image();
            image.src = uri;
            image.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                var a = document.createElement('a');
                a.download = name;
                a.href = canvas.toDataURL('image/png');
                document.body.appendChild(a);
                a.click();
            }
        });
    }
})();

/**
  @ngdoc container
  @name chart
  @module wk.chart
  @restrict E
  @description

  chart is the container directive for all charts.
  @param {array} data - Data to be graphed, {@link guide/data ...more}
  @param {boolean} [deep-watch=false]
  @param {string} [filter] - filters the data using the angular filter function
  @param {string} [header] - The chart title
  @param {object} [headerStyle=font-size:"1.8em"]
  @param {string} [subHeader] - The chart subtitle
  @param {object} [subHeaderStyle=font-size:"1.3em"]
  @param {boolean} [edit=false] - sets chart to edit mode if true
  @param {function} [edit-selection] - called when and editable chart element is clicked in edit mode.
  @param {number} [animation-duration=300] - animation duration in milliseconds
 */
angular.module('wk.chart').directive('chart', function($log, chart, $filter) {
  var chartCnt;
  chartCnt = 0;
  return {
    restrict: 'E',
    require: 'chart',
    scope: {
      data: '=',
      filter: '=',
      editSelected: '&'
    },
    controller: function($scope) {
      this.me = chart();
      return this.me.scope($scope);
    },
    link: function(scope, element, attrs, controller) {
      var dataWatchFn, deepWatch, me, watcherRemoveFn, _data, _filter;
      me = controller.me;
      deepWatch = false;
      watcherRemoveFn = void 0;
      element.addClass(me.id());
      _data = void 0;
      _filter = void 0;
      me.container().element(element[0]);
      me.lifeCycle().configure();
      me.lifeCycle().on('scopeApply', function() {
        return scope.$apply();
      });
      me.lifeCycle().on('editSelected', function(selection, object) {
        scope.editSelected({
          selected: selection,
          object: object
        });
        return scope.$apply();
      });
      attrs.$observe('animationDuration', function(val) {
        if (val && _.isNumber(+val) && +val >= 0) {
          return me.animationDuration(val);
        }
      });
      attrs.$observe('header', function(val) {
        if (val) {
          return me.title(val);
        } else {
          return me.title(void 0);
        }
      });
      attrs.$observe('headerStyle', function(val) {
        if (val) {
          return me.titleStyle(scope.$eval(val));
        }
      });
      attrs.$observe('subHeader', function(val) {
        if (val) {
          return me.subTitle(val);
        } else {
          return me.subTitle(void 0);
        }
      });
      attrs.$observe('subHeaderStyle', function(val) {
        if (val) {
          return me.subTitleStyle(scope.$eval(val));
        }
      });
      scope.$watch('filter', function(val) {
        if (val) {
          _filter = val;
          if (_data) {
            return me.lifeCycle().newData($filter('filter')(_data, _filter));
          }
        } else {
          _filter = void 0;
          if (_data) {
            return me.lifeCycle().newData(_data);
          }
        }
      });
      attrs.$observe('deepWatch', function(val) {
        if (val !== void 0 && val !== 'false') {
          deepWatch = true;
        } else {
          deepWatch = false;
        }
        if (watcherRemoveFn) {
          watcherRemoveFn();
        }
        return watcherRemoveFn = scope.$watch('data', dataWatchFn, deepWatch);
      });
      attrs.$observe('edit', function(val) {
        if (val === '' || val === 'true') {
          return me.editMode(true);
        } else {
          return me.editMode(false);
        }
      });
      dataWatchFn = function(val) {
        if (val) {
          _data = val;
          if (_.isArray(_data) && _data.length === 0) {
            return;
          }
          if (_filter) {
            return me.lifeCycle().newData($filter('filter')(val, _filter));
          } else {
            return me.lifeCycle().newData(val);
          }
        }
      };
      watcherRemoveFn = scope.$watch('data', dataWatchFn, deepWatch);
      return element.on('$destroy', function() {
        if (watcherRemoveFn) {
          watcherRemoveFn();
        }
        $log.log('Destroying chart');
        return me.lifeCycle().destroy();
      });
    }
  };
});


/**
  @ngdoc container
  @name layout
  @module wk.chart
  @restrict E
  @requires chart
  @description

  Layout is the container for the layout directives. It requires chart as a parent.
 */
angular.module('wk.chart').directive('layout', function($log, layout, container) {
  var layoutCnt;
  layoutCnt = 0;
  return {
    restrict: 'AE',
    require: ['layout', '^chart'],
    controller: function($element) {
      return this.me = layout();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, me;
      me = controllers[0].me;
      chart = controllers[1].me;
      me.chart(chart);
      element.addClass(me.id());
      chart.addLayout(me);
      chart.container().addLayout(me);
      return me.container(chart.container());
    }
  };
});

angular.module('wk.chart').directive('printButton', function($log) {
  return {
    require: 'chart',
    restrict: 'A',
    link: function(scope, element, attrs, controller) {
      var chart, draw;
      chart = controller.me;
      draw = function() {
        var _containerDiv;
        _containerDiv = d3.select(chart.container().element()).select('div.wk-chart');
        return _containerDiv.append('button').attr('class', 'wk-chart-print-button').style({
          position: 'absolute',
          top: 0,
          right: 0
        }).text('Print').on('click', function() {
          var svg;
          $log.log('Clicked Print Button');
          svg = _containerDiv.select('svg.wk-chart').node();
          return saveSvgAsPng(svg, 'print.png', 5);
        });
      };
      return chart.lifeCycle().on('drawChart.print', draw);
    }
  };
});


/**
  @ngdoc behavior
  @name selection
  @element layout
  @module wk.chart
  @restrict A
  @description
  enables selection of individual chart objects
 */
angular.module('wk.chart').directive('selection', function($log) {
  var objId;
  objId = 0;
  return {
    restrict: 'A',
    scope: {

      /**
        @ngdoc attr
        @name selection#selectedDomain
        @param selectedDomain {array} Array containing the selected data objects.
       */
      selectedDomain: '=',

      /**
        @ngdoc attr
        @name selection#selectedDomainChange
        @param selectedDomainChange {expression} expression to evaluate upon a change of the brushes selected domain. The selected domain is available as ´domain´
       */
      selectedDomainChange: '&',

      /**
        @ngdoc attr
        @name selection#clearSelection
        @param clearSelection {function} assigns a function that clears the selection when called via a bound scope variable.
        * Usage: bind a scope variable to the attribute: `clear-selection="scopeVar"`. `selection` assigns a function to scopeVar that can be called to reset the brush, e.g. in a button: `<button ng-click="scopeVar()">Clear Selection</button>`
       */
      clearSelection: "="
    },
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var layout;
      layout = controller.me;
      return layout.lifeCycle().on('configure.selection', function() {
        var _selection;
        _selection = layout.behavior().selected;
        _selection.layout(layout);
        scope.$watch('clearSelection', function(val) {
          if (attrs.clearSelection) {
            return scope.clearSelection = _selection.clearSelection;
          }
        });
        _selection.active(true);
        return _selection.on('selected', function(selectedObjects) {
          if (scope.selectedDomain) {
            scope.selectedDomain = selectedObjects;
          }
          scope.selectedDomainChange({
            domain: selectedObjects
          });
          return scope.$apply();
        });
      });
    }
  };
});


/**
  @ngdoc behavior
  @name tooltips
  @element chart
  @module wk.chart
  @restrict A
  @description
  enables the display of tooltips. See  the {@link guide/tooltips tooltips section} in the guide for more details
 */
angular.module('wk.chart').directive('tooltips', function($log, behavior) {
  return {
    restrict: 'A',
    require: 'chart',
    link: function(scope, element, attrs, chartCtrl) {
      var chart;
      chart = chartCtrl.me;

      /**
        @ngdoc attr
        @name tooltips#tooltips
        @values true, false, path/to/custom-template.html
        @param tooltips {boolean|url} - enable / disable tooltips, resp. supply a custom tooltip template url.
        If no template url is supplied, a (configurable) default template is used (see {@link wkChartTemplatesProvider here} for how to configure the default template),
       */
      return attrs.$observe('tooltips', function(val) {
        chart.toolTipTemplate('');
        if (val !== void 0 && (val === '' || val === 'true')) {
          return chart.showTooltip(true);
        } else if (val.length > 0 && val !== 'false') {
          chart.toolTipTemplate(val);
          return chart.showTooltip(true);
        } else {
          return chart.showTooltip(false);
        }
      });
    }
  };
});

angular.module('wk.chart').factory('dataManagerFactory', function($log) {
  var merge, mergeSeriesKeys;
  mergeSeriesKeys = function(aOld, aNew, moveItemsMove) {
    var atBorder, cur, i, iNew, iOld, iPred, iSucc, idx, lMax, lNewMax, lOldMax, result;
    iOld = 0;
    iNew = 0;
    lOldMax = aOld.length - 1;
    lNewMax = aNew.length - 1;
    lMax = Math.max(lOldMax, lNewMax);
    result = [];
    iPred = 0;
    if (moveItemsMove) {
      while (iOld <= lOldMax && iNew <= lNewMax) {
        if ((idx = aNew.indexOf(aOld[iOld])) >= 0) {
          result.push({
            iOld: iOld,
            iNew: idx,
            key: aOld[iOld]
          });
          iPred = iOld;
          iOld++;
        } else {
          result.push({
            deleted: true,
            iOld: iOld,
            key: aOld[iOld],
            atBorder: iNew === 0,
            lowBorder: iNew === 0
          });
          iOld++;
        }
        if (aOld.indexOf(aNew[iNew]) < 0) {
          result.push({
            added: true,
            iPred: iPred,
            predKey: aOld[iPred],
            iNew: Math.min(iNew, lNewMax),
            key: aNew[iNew],
            atBorder: iOld === 0,
            lowBorder: iOld === 0
          });
          iNew++;
        } else {
          iNew++;
        }
      }
    } else {
      while (iOld <= lOldMax && iNew <= lNewMax) {
        if (aOld[iOld] === aNew[iNew]) {
          result.push({
            iOld: iOld,
            iNew: Math.min(iNew, lNewMax),
            key: aOld[iOld]
          });
          iPred = iOld;
          iOld++;
          iNew++;
        } else if (aOld.indexOf(aNew[iNew], iOld) >= 0) {
          result.push({
            deleted: true,
            iOld: iOld,
            key: aOld[iOld],
            atBorder: iNew === 0,
            lowBorder: iNew === 0
          });
          iOld++;
        } else {
          result.push({
            added: true,
            iPred: iPred,
            predKey: aOld[iPred],
            iNew: Math.min(iNew, lNewMax),
            key: aNew[iNew],
            atBorder: iOld === 0,
            lowBorder: iOld === 0
          });
          iNew++;
        }
      }
    }
    while (iOld <= lOldMax) {
      result.push({
        deleted: true,
        iOld: iOld,
        key: aOld[iOld],
        atBorder: true,
        highBorder: true
      });
      iOld++;
    }
    while (iNew <= lNewMax) {
      result.push({
        added: true,
        iPred: iPred,
        predKey: aOld[iPred],
        iNew: Math.min(iNew, lNewMax),
        key: aNew[iNew],
        atBorder: true,
        highBorder: true
      });
      iNew++;
    }
    i = result.length - 1;
    atBorder = true;
    iSucc = aNew.length - 1;
    while (i >= 0) {
      cur = result[i];
      if (cur.deleted) {
        cur.iSucc = iSucc;
        cur.succKey = aNew[iSucc];
      } else {
        iSucc = cur.iNew;
        atBorder = false;
      }
      i--;
    }
    return result;
  };
  merge = function() {
    var getMergedEnd, getMergedStart, me, _dataNew, _dataOld, _isOrdinal, _isRangeScale, _keyNew, _keyOld, _keyScale, _layerKeysNew, _layerKeysOld, _mergedKeys, _mergedLayerKeys, _valueScale;
    _dataOld = [];
    _dataNew = [];
    _keyOld = [];
    _keyNew = [];
    _keyScale = void 0;
    _valueScale = void 0;
    _mergedKeys = [];
    _layerKeysNew = [];
    _layerKeysOld = [];
    _mergedLayerKeys = void 0;
    _isOrdinal = true;
    _isRangeScale = false;
    me = {};
    me.data = function(data, moveItemsMove) {
      _dataOld = _dataNew;
      _keyOld = _keyNew;
      _layerKeysOld = _layerKeysNew;
      _layerKeysNew = _valueScale.layerKeys(data);
      _dataNew = _.cloneDeep(data);
      _keyNew = _keyScale.value(data);
      if (_keyScale.scaleType() === 'time') {
        _keyNew = _keyNew.map(function(d) {
          return +d;
        });
      }
      _mergedKeys = mergeSeriesKeys(_keyOld, _keyNew, moveItemsMove);
      _mergedLayerKeys = mergeSeriesKeys(_layerKeysOld, _layerKeysNew);
      return me;
    };
    me.isInitial = function() {
      return _dataOld.length === 0;
    };
    getMergedStart = (function(_this) {
      return function() {
        var atBorder, borderKey, cur, i, lastKey, lastOld, ret;
        ret = [];
        lastKey = _keyOld[0];
        atBorder = true;
        lastOld = void 0;
        cur = void 0;
        i = 0;
        borderKey = function(cur) {
          if (_isOrdinal) {
            return lastKey;
          } else {
            return cur.key;
          }
        };
        while (i < _mergedKeys.length) {
          cur = _mergedKeys[i];
          if (cur.iOld !== void 0) {
            ret.push({
              added: false,
              key: cur.key,
              targetKey: cur.key,
              data: _dataOld[cur.iOld],
              targetData: _dataOld[cur.iOld]
            });
            lastKey = cur.key;
            lastOld = cur.iOld;
            atBorder = false;
          } else {
            ret.push({
              added: true,
              atBorder: atBorder,
              lowBorder: cur.lowBorder,
              highBorder: cur.highBorder,
              targetKey: (cur.atBorder && !_isOrdinal ? cur.key : lastKey),
              key: cur.key,
              data: cur.atBorder ? _dataNew[cur.iNew] : _dataOld[lastOld],
              targetData: _dataNew[cur.iNew]
            });
          }
          i++;
        }
        return ret;
      };
    })(this);
    me.animationStartLayers = function() {
      var series;
      series = getMergedStart();
      return _mergedLayerKeys.map(function(layerKey) {
        return {
          layerKey: layerKey.iOld === void 0 ? _layerKeysNew[layerKey.iNew] : layerKey.key,
          added: layerKey.iOld === void 0,
          values: series.map(function(d) {
            return {
              key: d.key,
              targetKey: d.targetKey,
              layerKey: layerKey.key,
              layerAdded: layerKey.iOld === void 0,
              added: d.added,
              atBorder: d.atBorder,
              lowBorder: d.lowBorder,
              highBorder: d.highBorder,
              value: !_isRangeScale ? _valueScale.layerValue(d.data, layerKey.key) : {
                upper: _valueScale.upperValue(d.data),
                lower: _valueScale.lowerValue(d.data)
              },
              targetValue: _valueScale.layerValue(d.targetData, layerKey.key),
              data: d.data
            };
          })
        };
      });
    };
    getMergedEnd = (function(_this) {
      return function() {
        var atBorder, borderKey, cur, i, lastKey, lastNew, ret;
        ret = [];
        lastKey = _keyNew[_keyNew.length - 1];
        lastNew = void 0;
        atBorder = true;
        i = _mergedKeys.length - 1;
        borderKey = function(cur) {
          if (_isOrdinal) {
            return lastKey;
          } else {
            return cur.key;
          }
        };
        while (i >= 0) {
          cur = _mergedKeys[i];
          if (cur.iNew !== void 0) {
            ret.unshift({
              deleted: false,
              key: cur.key,
              targetKey: cur.key,
              data: _dataNew[cur.iNew],
              targetData: _dataNew[cur.iNew]
            });
            lastKey = cur.key;
            lastNew = cur.iNew;
            atBorder = false;
          } else {
            ret.unshift({
              deleted: true,
              atBorder: atBorder,
              lowBorder: cur.lowBorder,
              highBorder: cur.highBorder,
              targetKey: (cur.atBorder && !_isOrdinal ? cur.key : lastKey),
              key: cur.key,
              data: cur.atBorder ? _dataOld[cur.iOld] : _dataNew[lastNew],
              targetData: _dataOld[cur.iOld]
            });
          }
          i--;
        }
        return ret;
      };
    })(this);
    me.animationEndLayers = function() {
      var series;
      series = getMergedEnd();
      return _mergedLayerKeys.map(function(layerKey) {
        return {
          layerKey: layerKey.iNew === void 0 ? _layerKeysOld[layerKey.iOld] : layerKey.key,
          deleted: layerKey.iNew === void 0,
          values: series.map(function(d) {
            return {
              key: d.key,
              targetKey: d.targetKey,
              layerKey: layerKey.key,
              layerDeleted: layerKey.iNew === void 0,
              deleted: d.deleted,
              atBorder: d.atBorder,
              lowBorder: d.lowBorder,
              highBorder: d.highBorder,
              value: !_isRangeScale ? _valueScale.layerValue(d.data, layerKey.key) : {
                upper: _valueScale.upperValue(d.data),
                lower: _valueScale.lowerValue(d.data)
              },
              targetValue: _valueScale.layerValue(d.targetData, layerKey.key),
              data: d.data
            };
          })
        };
      });
    };
    me.keyScale = function(scale) {
      if (arguments.length === 0) {
        return _keyScale;
      }
      _keyScale = scale;
      _isOrdinal = scale.isOrdinal();
      return me;
    };
    me.valueScale = function(scale) {
      if (arguments.length === 0) {
        return _valueScale;
      }
      _valueScale = scale;
      _isRangeScale = scale.kind() === 'rangeX' || scale.kind() === 'rangeY';
      return me;
    };
    return me;
  };
  return merge;
});


/**
  @ngdoc dimension
  @name color
  @module wk.chart
  @restrict E
  @description

  describes how the chart data is translated into colors for chart objects
 */
angular.module('wk.chart').directive('color', function($log, scale, legend, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['color', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    scope: {
      mapFunction: '='
    },
    link: function(scope, element, attrs, controllers) {
      var chart, l, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      l = void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'color';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('category20');
      element.addClass(me.id());
      chart.addScale(me, layout);
      me.register();
      scaleUtils.observeSharedAttributes(attrs, me);
      scaleUtils.observeLegendAttributes(attrs, me, layout);
      return scope.$watch('mapFunction', function(fn) {
        if (fn && _.isFunction(fn)) {
          return me.scaleMapFn(fn);
        }
      });
    }
  };
});

angular.module('wk.chart').service('scaleUtils', function($log, wkChartScales, utils) {
  var parseList;
  parseList = function(val) {
    var l;
    if (val) {
      l = val.trim().replace(/^\[|\]$/g, '').split(',').map(function(d) {
        return d.replace(/^[\"|']|[\"|']$/g, '');
      });
      l = l.map(function(d) {
        if (isNaN(d)) {
          return d;
        } else {
          return +d;
        }
      });
      if (l.length === 1) {
        return l[0];
      } else {
        return l;
      }
    }
  };
  return {
    observeSharedAttributes: function(attrs, me) {

      /**
        @ngdoc attr
        @name type
        @usedBy dimension
        @param [type=layout specific - see layout docs] {scale}
        Defines the d3 scale applied to transform the input data to a dimensions display value. All d3 scales are supported, as well as wk-chart specific extensions described here. #TODO insert correct links
       */
      attrs.$observe('type', function(val) {
        if (val !== void 0) {
          if (d3.scale.hasOwnProperty(val) || val === 'time' || wkChartScales.hasOwnProperty(val)) {
            me.scaleType(val);
          } else {
            if (val !== '') {
              $log.error("Error: illegal scale value: " + val + ". Using 'linear' scale instead");
            }
          }
          return me.update();
        }
      });

      /**
        @ngdoc attr
        @name exponent
        @usedBy dimension
        @param [exponent] {number}
        This attribute is only evaluated with pow and log scale types - defines the exponent for the d3 pow and log scale #TODO insert correct links
       */
      attrs.$observe('exponent', function(val) {
        if (me.scaleType() === 'pow' && _.isNumber(+val)) {
          return me.exponent(+val).update();
        }
      });

      /**
        @ngdoc attr
        @name property
        @usedBy dimension
        @param property{expression}
          the input data property (properties) used to compute this dimension. In case the charts supports a the data layer dimension this attribute can be a list of data properties.
          In this case the property field can be omitted, for non-layer dimension it is required.
       */
      attrs.$observe('property', function(val) {
        return me.property(parseList(val)).update();
      });

      /**
        @ngdoc attr
        @name layerProperty
        @usedBy dimension
        @param [layerProperty] {expression}
        defines the container object for property in case the data is a hierachical structure. See (#todo define link)
         for more detail
       */
      attrs.$observe('layerProperty', function(val) {
        if (val && val.length > 0) {
          return me.layerProperty(val).update();
        }
      });

      /**
        @ngdoc attr
        @name range
        @usedBy dimension
        @param [range] {expression}
        The scale types range attribute. For x and y scales the range is set to the pixel width and height of the drawing container, for category... scales the range is set to the scales color range
       */
      attrs.$observe('range', function(val) {
        var range;
        range = parseList(val);
        if (Array.isArray(range)) {
          return me.range(range).update();
        }
      });

      /**
        @ngdoc attr
        @name dateFormat
        @usedBy dimension
        @param [dateFormat] {expression}
        applies to Time scale type only. Describes the date display format of the property field content. can be omitted if the field is already a javascript Date object, otherwise the format is used to transform
        the property values into a Javascript Date object.Date Format is described using d3's [Time Format](https://github.com/mbostock/d3/wiki/Time-Formatting#format)
       */
      attrs.$observe('dateFormat', function(val) {
        if (val) {
          if (me.scaleType() === 'time') {
            return me.dataFormat(val).update();
          }
        }
      });

      /**
        @ngdoc attr
        @name domain
        @usedBy dimension
        @param [domain] {expression}
        the scale types domain property. Meaning and acceptable values for domain depend on teh scale type, thus please see (TODO: define link)
        for further explanation
       */
      attrs.$observe('domain', function(val) {
        var parsedList;
        if (val) {
          $log.info('domain', val);
          parsedList = parseList(val);
          if (Array.isArray(parsedList)) {
            return me.domain(parsedList).update();
          } else {
            return $log.error("domain: must be array, or comma-separated list, got", val);
          }
        } else {
          return me.domain(void 0).update();
        }
      });

      /**
        @ngdoc attr
        @name domainRange
        @usedBy dimension
        @param [domainRange] {expression}
        Certain scale type and dimensions require a calculation of the data range to perform the correct mapping onto the scale output.domainRange defined the rule to be used to calculate this. Possible values are:
        min: [0 .. minimum data value]
        max: [0 .. maximum data value]
        extent: [minimum data value .. maximum data value]
        total: applies only layer dimensions, calculates as 0 ..  maximum of the layer value totals]
       */
      attrs.$observe('domainRange', function(val) {
        if (val) {
          return me.domainCalc(val).update();
        }
      });

      /**
        @ngdoc attr
        @name label
        @usedBy dimension
        @param [label] {expression}
        defined the dimensions label text. If not specified, the value of teh 'property' attribute is used
       */
      attrs.$observe('label', function(val) {
        if (val !== void 0) {
          return me.axisLabel(val).updateAttrs();
        }
      });

      /**
        @ngdoc attr
        @name format
        @usedBy dimension
        @param [format] {expression}
         a formatting string used to display tooltip and legend values for the dimension. if omitted, a default format will be applied
        please note tha this is different from the 'tickFormat' attribute
       */
      attrs.$observe('format', function(val) {
        if (val !== void 0) {
          return me.format(val);
        }
      });

      /**
        @ngdoc attr
        @name reset
        @usedBy dimension
        @param [reset] {expression}
         If sepcified or set to true, the domain values are reset every time the carts data changes.
       */
      return attrs.$observe('reset', function(val) {
        return me.resetOnNewData(utils.parseTrueFalse(val));
      });
    },
    observeAxisAttributes: function(attrs, me, scope) {

      /**
          @ngdoc attr
          @name labelStyle
          @usedBy dimension.x, dimension.y
          @param [labelStyle=font-size:"1.3em"] {object}
       */
      attrs.$observe('labelStyle', function(val) {
        if (val) {
          return me.axisLabelStyle(scope.$eval(val));
        }
      });

      /**
          @ngdoc attr
          @name tickFormat
          @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
          @param [tickFormat] {expression}
       */
      attrs.$observe('tickFormat', function(val) {
        if (val !== void 0) {
          return me.tickFormat(d3.format(val)).update();
        }
      });

      /**
        @ngdoc attr
        @name ticks
        @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
        @param [ticks] {expression}
       */
      attrs.$observe('ticks', function(val) {
        if (val !== void 0) {
          me.ticks(+val);
          if (me.axis()) {
            return me.updateAttrs();
          }
        }
      });

      /**
          @ngdoc attr
          @name tickLabelStyle
          @usedBy dimension.x, dimension.y
          @param [tickLabelStyle=font-size:"1em"] {object}
       */
      attrs.$observe('tickLabelStyle', function(val) {
        if (val) {
          return me.tickLabelStyle(scope.$eval(val));
        }
      });

      /**
        @ngdoc attr
        @name grid
        @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
        @param [grid] {expression}
       */
      attrs.$observe('grid', function(val) {
        if (val !== void 0) {
          return me.showGrid(val === '' || val === 'true').updateAttrs();
        }
      });

      /**
        @ngdoc attr
        @name showLabel
        @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
        @param [showLabel] {expression}
       */
      attrs.$observe('showLabel', function(val) {
        if (val !== void 0) {
          return me.showLabel(val === '' || val === 'true').update(true);
        }
      });

      /**
        @ngdoc attr
        @name axisFormatters
        @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
        @param [axisFormatters] {expression}
       */
      scope.$watch(attrs.axisFormatters, function(val) {
        if (_.isObject(val)) {
          if (_.has(val, 'tickFormat') && _.isFunction(val.tickFormat)) {
            me.tickFormat(val.tickFormat);
          } else if (_.isString(val.tickFormat)) {
            me.tickFormat(d3.format(val));
          }
          if (_.has(val, 'tickValues') && _.isArray(val.tickValues)) {
            me.tickValues(val.tickValues);
          }
          return me.update();
        }
      });

      /**
        @ngdoc attr
        @name reverse
        @usedBy dimension.x, dimension.y, dimension.rangeX, dimension.rangeY
        @param [reverse] {boolean}
        reverses the direction of the axes if `true` , i.e. values are displayed in reverse order.
       */
      return attrs.$observe('reverse', function(val) {
        if (val !== void 0) {
          return me.reverse(val === '' || val === 'true').update();
        }
      });
    },
    observeLegendAttributes: function(attrs, me, layout) {

      /**
        @ngdoc attr
        @name legend
        @usedBy dimension
        @values true, false, top-right, top-left, bottom-left, bottom-right, #divName
        @param [legend=true] {expression}
       */
      attrs.$observe('legend', function(val) {
        var l, legendDiv;
        if (val !== void 0) {
          l = me.legend();
          l.showValues(false);
          switch (val) {
            case 'false':
              l.show(false);
              break;
            case 'top-left':
            case 'top-right':
            case 'bottom-left':
            case 'bottom-right':
              l.position(val).div(void 0).show(true);
              break;
            case 'true':
            case '':
              l.position('top-right').show(true).div(void 0);
              break;
            default:
              legendDiv = d3.select(val);
              if (legendDiv.empty()) {
                $log.warn('legend reference does not exist:', val);
                l.div(void 0).show(false);
              } else {
                l.div(legendDiv).position('top-left').show(true);
              }
          }
          l.scale(me).layout(layout);
          if (me.parent()) {
            l.register(me.parent());
          }
          return l.redraw();
        }
      });

      /**
        @ngdoc attr
        @name valuesLegend
        @usedBy dimension
        @param [valuesLegend] {expression}
       */
      attrs.$observe('valuesLegend', function(val) {
        var l, legendDiv;
        if (val !== void 0) {
          l = me.legend();
          l.showValues(true);
          switch (val) {
            case 'false':
              l.show(false);
              break;
            case 'top-left':
            case 'top-right':
            case 'bottom-left':
            case 'bottom-right':
              l.position(val).div(void 0).show(true);
              break;
            case 'true':
            case '':
              l.position('top-right').show(true).div(void 0);
              break;
            default:
              legendDiv = d3.select(val);
              if (legendDiv.empty()) {
                $log.warn('legend reference does not exist:', val);
                l.div(void 0).show(false);
              } else {
                l.div(legendDiv).position('top-left').show(true);
              }
          }
          l.scale(me).layout(layout);
          if (me.parent()) {
            l.register(me.parent());
          }
          return l.redraw();
        }
      });

      /**
        @ngdoc attr
        @name legendTitle
        @usedBy dimension
        @param [legendTitle] {expression}
       */
      return attrs.$observe('legendTitle', function(val) {
        if (val !== void 0) {
          return me.legend().title(val).redraw();
        }
      });
    },
    observerRangeAttributes: function(attrs, me) {

      /**
        @ngdoc attr
        @name lowerProperty
        @usedBy dimension.rangeX, dimension.rangeY
        @param [lowerProperty] {expression}
       */
      attrs.$observe('lowerProperty', function(val) {
        return me.lowerProperty(parseList(val)).update();
      });

      /**
        @ngdoc attr
        @name upperProperty
        @usedBy dimension.rangeX, dimension.rangeY
        @param [upperProperty] {expression}
       */
      return attrs.$observe('upperProperty', function(val) {
        return me.upperProperty(parseList(val)).update();
      });
    }
  };
});


/**
  @ngdoc dimension
  @name shape
  @module wk.chart
  @restrict E
  @description

  describes how the chart data is translated into shape objects in teh chart
 */
angular.module('wk.chart').directive('shape', function($log, scale, d3Shapes, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['shape', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'shape';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('ordinal');
      me.scale().range(d3Shapes);
      element.addClass(me.id());
      chart.addScale(me, layout);
      me.register();
      scaleUtils.observeSharedAttributes(attrs, me);
      return scaleUtils.observeLegendAttributes(attrs, me, layout);
    }
  };
});


/**
  @ngdoc dimension
  @name size
  @module wk.chart
  @restrict E
  @description

  describes how the chart data is translated into the size of chart objects
 */
angular.module('wk.chart').directive('size', function($log, scale, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['size', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'size';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('linear');
      me.resetOnNewData(true);
      element.addClass(me.id());
      chart.addScale(me, layout);
      me.register();
      scaleUtils.observeSharedAttributes(attrs, me);
      return scaleUtils.observeLegendAttributes(attrs, me, layout);
    }
  };
});


/**
  @ngdoc dimension
  @name x
  @module wk.chart
  @restrict E
  @description

  This dimension defined the horizontal axis of the chart

  @param {string} axis
  Define if a horizontal axis should be displayed Possible values:
 */
angular.module('wk.chart').directive('x', function($log, scale, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['x', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'x';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('linear');
      me.resetOnNewData(true);
      me.isHorizontal(true);
      me.register();
      element.addClass(me.id());
      chart.addScale(me, layout);
      scaleUtils.observeSharedAttributes(attrs, me);
      attrs.$observe('axis', function(val) {
        if (val !== void 0) {
          if (val !== 'false') {
            if (val === 'top' || val === 'bottom') {
              me.axisOrient(val).showAxis(true);
            } else {
              me.axisOrient('bottom').showAxis(true);
            }
          } else {
            me.showAxis(false).axisOrient(void 0);
          }
          return me.update(true);
        }
      });
      scaleUtils.observeAxisAttributes(attrs, me, scope);
      scaleUtils.observeLegendAttributes(attrs, me, layout);
      return attrs.$observe('rotateTickLabels', function(val) {
        if (val && _.isNumber(+val)) {
          me.rotateTickLabels(+val);
        } else {
          me.rotateTickLabels(void 0);
        }
        return me.update(true);
      });
    }
  };
});


/**
  @ngdoc dimension
  @name rangeX
  @module wk.chart
  @restrict E
  @description

  describes how the chart data is translated into horizontal ranges for the chart objects
 */
angular.module('wk.chart').directive('rangeX', function($log, scale, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['rangeX', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'rangeX';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('linear');
      me.resetOnNewData(true);
      me.isHorizontal(true);
      me.register();
      element.addClass(me.id());
      chart.addScale(me, layout);
      scaleUtils.observeSharedAttributes(attrs, me);
      attrs.$observe('axis', function(val) {
        if (val !== void 0) {
          if (val !== 'false') {
            if (val === 'top' || val === 'bottom') {
              me.axisOrient(val).showAxis(true);
            } else {
              me.axisOrient('bottom').showAxis(true);
            }
          } else {
            me.showAxis(false).axisOrient(void 0);
          }
          return me.update(true);
        }
      });
      scaleUtils.observeAxisAttributes(attrs, me, scope);
      scaleUtils.observeLegendAttributes(attrs, me, layout);
      scaleUtils.observerRangeAttributes(attrs, me);
      return attrs.$observe('rotateTickLabels', function(val) {
        if (val && _.isNumber(+val)) {
          me.rotateTickLabels(+val);
        } else {
          me.rotateTickLabels(void 0);
        }
        return me.update(true);
      });
    }
  };
});


/**
  @ngdoc dimension
  @name y
  @module wk.chart
  @restrict E
  @description

  This dimension defined the vertical axis of the chart

  @param {string} axis
  Define if a vertical axis should be displayed Possible values:
 */
angular.module('wk.chart').directive('y', function($log, scale, legend, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['y', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'y';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('linear');
      me.isVertical(true);
      me.resetOnNewData(true);
      element.addClass(me.id());
      chart.addScale(me, layout);
      me.register();
      scaleUtils.observeSharedAttributes(attrs, me);
      attrs.$observe('axis', function(val) {
        if (val !== void 0) {
          if (val !== 'false') {
            if (val === 'left' || val === 'right') {
              me.axisOrient(val).showAxis(true);
            } else {
              me.axisOrient('left').showAxis(true);
            }
          } else {
            me.showAxis(false).axisOrient(void 0);
          }
          return me.update(true);
        }
      });
      scaleUtils.observeAxisAttributes(attrs, me, scope);
      return scaleUtils.observeLegendAttributes(attrs, me, layout);
    }
  };
});


/**
  @ngdoc dimension
  @name rangeY
  @module wk.chart
  @restrict E
  @description

  describes how the chart data is translated into vertical ranges for the chart objects
 */
angular.module('wk.chart').directive('rangeY', function($log, scale, legend, scaleUtils) {
  var scaleCnt;
  scaleCnt = 0;
  return {
    restrict: 'E',
    require: ['rangeY', '^chart', '?^layout'],
    controller: function($element) {
      return this.me = scale();
    },
    link: function(scope, element, attrs, controllers) {
      var chart, layout, me, name, _ref;
      me = controllers[0].me;
      chart = controllers[1].me;
      layout = (_ref = controllers[2]) != null ? _ref.me : void 0;
      if (!(chart || layout)) {
        $log.error('scale needs to be contained in a chart or layout directive ');
        return;
      }
      name = 'rangeY';
      me.kind(name);
      me.parent(layout || chart);
      me.chart(chart);
      me.scaleType('linear');
      me.isVertical(true);
      me.resetOnNewData(true);
      element.addClass(me.id());
      chart.addScale(me, layout);
      me.register();
      scaleUtils.observeSharedAttributes(attrs, me);
      attrs.$observe('axis', function(val) {
        if (val !== void 0) {
          if (val !== 'false') {
            if (val === 'left' || val === 'right') {
              me.axisOrient(val).showAxis(true);
            } else {
              me.axisOrient('left').showAxis(true);
            }
          } else {
            me.showAxis(false).axisOrient(void 0);
          }
          return me.update(true);
        }
      });
      scaleUtils.observeAxisAttributes(attrs, me, scope);
      scaleUtils.observeLegendAttributes(attrs, me, layout);
      return scaleUtils.observerRangeAttributes(attrs, me);
    }
  };
});


/**
  @ngdoc layout
  @name area
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a area chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
  @example
 */
angular.module('wk.chart').directive('area', function($log, utils, tooltipHelperFactory, dataManagerFactory, markerFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _initialOpacity, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      _tooltip = void 0;
      _scaleList = {};
      _showMarkers = false;
      _spline = false;
      offset = 0;
      _id = 'area' + lineCntr++;
      area = void 0;
      layoutData = void 0;
      _initialOpacity = 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(x).valueScale(y).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var enter, layers, path;
        offset = x.isOrdinal() ? x.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        area = d3.svg.area().x(function(d) {
          return x.scale()(d.targetKey);
        }).y(function(d) {
          return y.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).y1(function(d) {
          return y.scale()(0);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-area-path').attr('d', function(d) {
          return area(d.values);
        }).style('opacity', _initialOpacity).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('fill', function(d) {
          return color.scale()(d.layerKey);
        });
        path = layers.select('.wk-chart-area-path').attr('transform', "translate(" + offset + ")");
        path = doAnimate ? path.transition().duration(options.duration) : path;
        path.attr('d', function(d) {
          return area(d.values);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        });
        layers.exit().remove();
        markers.x(function(d) {
          return x.scale()(d.targetKey) + (x.isOrdinal() ? x.scale().rangeBand() / 2 : 0);
        }).y(function(d) {
          return y.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        var lines;
        lines = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          lines.attr('d', function(d) {
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          lines.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.x);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name area#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name area#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name areaStacked
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a horizontally stacked area chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=total]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('areaStacked', function($log, utils, tooltipHelperFactory, dataManagerFactory, markerFactory) {
  var stackedAreaCntr;
  stackedAreaCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layers, layoutData, markers, offs, offset, scaleY, setAnimationEnd, setAnimationStart, stack, stackLayout, ttHelper, xData, _id, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      stack = d3.layout.stack();
      offset = 'zero';
      layers = null;
      _showMarkers = false;
      _spline = false;
      stackLayout = [];
      area = void 0;
      _tooltip = void 0;
      _scaleList = {};
      scaleY = void 0;
      offs = 0;
      _id = 'areaStacked' + stackedAreaCntr++;
      xData = dataManagerFactory();
      markers = markerFactory();
      layoutData = void 0;
      ttHelper = tooltipHelperFactory();
      stack.values(function(d) {
        return d.values;
      }).y(function(d) {
        if (d.layerAdded || d.layerDeleted) {
          return 0;
        } else {
          return d.value;
        }
      }).x(function(d) {
        return d.targetKey;
      });
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(x).valueScale(y).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var enter, pathLayers, updLayers;
        stackLayout = stack(data);
        offs = x.isOrdinal() ? x.scale().rangeBand() / 2 : 0;
        $log.log('offset', offs);
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        if (!layers) {
          layers = this.selectAll('.wk-chart-layer');
        }
        if (offset === 'expand') {
          scaleY = y.scale().copy();
          scaleY.domain([0, 1]);
        } else {
          scaleY = y.scale();
        }
        area = d3.svg.area().x(function(d) {
          return x.scale()(d.targetKey);
        }).y0(function(d) {
          return scaleY(d.y0 + d.y);
        }).y1(function(d) {
          return scaleY(d.y0);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        layers = layers.data(stackLayout, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-area-path').style('pointer-events', 'none').style('opacity', 0);
        pathLayers = layers.select('.wk-chart-area-path').style('fill', function(d, i) {
          return color.scale()(d.layerKey);
        }).style('stroke', function(d, i) {
          return color.scale()(d.layerKey);
        }).attr('transform', "translate(" + offs + ")");
        updLayers = doAnimate ? pathLayers.transition().duration(options.duration) : pathLayers;
        updLayers.attr('d', function(d) {
          return area(d.values);
        }).style('opacity', 1);
        layers.exit().remove();
        markers.x(function(d) {
          return x.scale()(d.targetKey);
        }).y(function(d) {
          return scaleY(d.y + d.y0);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        layers = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          layers.attr('d', function(d) {
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          layers.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('total').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).isStacked(true).colorScale(_scaleList.color).value(function(d) {
          return d.y + d.y0;
        });
        _tooltip.markerScale(_scaleList.x);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
          @ngdoc attr
          @name areaStacked#areaStacked
          @values zero, silhouette, expand, wiggle
          @param [areaStacked=zero] {string} Defines how the areas are stacked.
          For a description of the stacking algorithms please see [d3 Documentation on Stack Layout](https://github.com/mbostock/d3/wiki/Stack-Layout#offset)
       */
      attrs.$observe('areaStacked', function(val) {
        if (val === 'zero' || val === 'silhouette' || val === 'expand' || val === 'wiggle') {
          offset = val;
        } else {
          offset = "zero";
        }
        stack.offset(offset);
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name areaStacked#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name areaStacked#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name areaStackedVertical
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a area chart layout

  @usesDimension x [type=linear, domainRange=total] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('areaStackedVertical', function($log, utils, tooltipHelperFactory, dataManagerFactory, markerFactory) {
  var areaStackedVertCntr;
  areaStackedVertCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layers, layoutData, markers, offs, offset, setAnimationEnd, setAnimationStart, stack, stackLayout, ttHelper, xData, _id, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      stack = d3.layout.stack();
      offset = 'zero';
      layers = null;
      _showMarkers = false;
      _spline = false;
      stackLayout = [];
      area = void 0;
      _tooltip = void 0;
      _scaleList = {};
      offs = 0;
      _id = 'areaStacked' + areaStackedVertCntr++;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      layoutData = void 0;
      stack.values(function(d) {
        return d.values;
      }).y(function(d) {
        if (d.layerAdded || d.layerDeleted) {
          return 0;
        } else {
          return d.value;
        }
      }).x(function(d) {
        return d.targetKey;
      });
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var enter, pathLayers, scaleX, updLayers;
        stackLayout = stack(data);
        offs = y.isOrdinal() ? y.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        if (!layers) {
          layers = this.selectAll('.wk-chart-layer');
        }
        if (offset === 'expand') {
          scaleX = x.scale().copy();
          scaleX.domain([0, 1]);
        } else {
          scaleX = x.scale();
        }
        area = d3.svg.area().x(function(d) {
          return -y.scale()(d.targetKey);
        }).y0(function(d) {
          return scaleX(d.y0 + d.y);
        }).y1(function(d) {
          return scaleX(d.y0);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        layers = layers.data(stackLayout, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-area-path').style('pointer-events', 'none').style('opacity', 0);
        pathLayers = layers.select('.wk-chart-area-path').style('fill', function(d, i) {
          return color.scale()(d.layerKey);
        }).style('stroke', function(d, i) {
          return color.scale()(d.layerKey);
        }).attr('transform', "translate(" + offs + ")rotate(-90)");
        updLayers = doAnimate ? pathLayers.transition().duration(options.duration) : pathLayers;
        updLayers.attr('d', function(d) {
          return area(d.values);
        }).style('opacity', 1);
        layers.exit().remove();
        markers.x(function(d) {
          return x.scale()(d.y + d.y0);
        }).y(function(d) {
          return y.scale()(d.targetKey) + (y.isOrdinal() ? y.scale().rangeBand() / 2 : 0);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        layers = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          layers.attr('d', function(d) {
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          layers.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('x').domainCalc('total').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).isStacked(true).colorScale(_scaleList.color).value(function(d) {
          return d.y + d.y0;
        });
        _tooltip.markerScale(_scaleList.y);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
          @ngdoc attr
          @name areaStackedVertical#areaStackedVertical
          @values zero, silhouette, expand, wiggle
          @param [areaStackedVertical=zero] {string} Defines how the areas are stacked.
          For a description of the stacking algorithms please see [d3 Documentation on Stack Layout](https://github.com/mbostock/d3/wiki/Stack-Layout#offset)
       */
      attrs.$observe('areaStackedVertical', function(val) {
        if (val === 'zero' || val === 'silhouette' || val === 'expand' || val === 'wiggle') {
          offset = val;
        } else {
          offset = "zero";
        }
        stack.offset(offset);
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name areaStackedVertical#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name areaStackedVertical#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name areaVertical
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a area chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('areaVertical', function($log, utils, tooltipHelperFactory, dataManagerFactory, markerFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _circles, _id, _initialOpacity, _scaleList, _showMarkers, _spline, _tooltip, _ttHighlight;
      host = controller.me;
      _tooltip = void 0;
      _ttHighlight = void 0;
      _circles = void 0;
      _scaleList = {};
      _spline = false;
      _showMarkers = false;
      offset = 0;
      area = void 0;
      _id = 'areaVertical' + lineCntr++;
      layoutData = void 0;
      _initialOpacity = 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var enter, layers, path;
        offset = y.isOrdinal() ? y.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        area = d3.svg.area().x(function(d) {
          return -y.scale()(d.targetKey);
        }).y(function(d) {
          return x.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).y1(function(d) {
          return x.scale()(0);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-area-path').attr('d', function(d) {
          return area(d.values);
        }).style('opacity', _initialOpacity).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('fill', function(d) {
          return color.scale()(d.layerKey);
        });
        path = layers.select('.wk-chart-area-path').attr('transform', "translate(0," + offset + ")rotate(-90)");
        path = doAnimate ? path.transition().duration(options.duration) : path;
        path.attr('d', function(d) {
          return area(d.values);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        }).style('pointer-events', 'none');
        layers.exit().remove();
        markers.isVertical(true).x(function(d) {
          return x.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).y(function(d) {
          return y.scale()(d.targetKey) + (y.isOrdinal() ? y.scale().rangeBand() / 2 : 0);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange, width, height) {
        var areaPath;
        areaPath = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          areaPath.attr('d', function(d) {
            null;
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(0," + (axis.scale().rangeBand() / 2) + ")rotate(-90)");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          areaPath.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.y);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name areaVertical#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name areaVertical#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name bars
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a bar chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('bars', function($log, utils, barConfig, dataLabelFactory, dataManagerFactory, tooltipHelperFactory) {
  var sBarCntr;
  sBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var barOuterPaddingOld, barPaddingOld, bars, brush, config, dataLabels, drawPath, host, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _selected, _tooltip;
      host = controller.me;
      _id = "bars" + (sBarCntr++);
      bars = null;
      barPaddingOld = 0;
      barOuterPaddingOld = 0;
      _scaleList = {};
      _selected = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      ttHelper = tooltipHelperFactory();
      dataLabels = dataLabelFactory();
      _tooltip = void 0;
      setAnimationStart = function(data, options, x, y, color) {
        var layoutData;
        xData.keyScale(y).valueScale(x).data(data, true);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        var layoutData;
        layoutData = xData.animationEndLayers();
        dataLabels.duration(options.duration).active(host.showDataLabels());
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barHeight, barOuterPadding, barPadding, enter, offset, rect;
        if (!bars) {
          bars = this.selectAll('.wk-chart-layer');
        }
        barHeight = y.scale().rangeBand();
        barPadding = barHeight / (1 - config.padding) * config.padding;
        barOuterPadding = barHeight / (1 - config.outerPadding) * config.outerPadding;
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return -barPadding / 2;
          }
          if (d.deleted) {
            return barHeight + barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barHeight + barPadding / 2;
          }
          if (d.added) {
            return -barPadding / 2;
          }
          return 0;
        };
        bars = bars.data(data[0].values, function(d, i) {
          return d.key;
        });
        enter = bars.enter().append('g').attr('class', 'wk-chart-layer').attr('transform', function(d) {
          return "translate(0, " + (y.scale()(d.targetKey)) + ")";
        });
        enter.append('rect').attr('class', 'wk-chart-rect wk-chart-selectable').attr('height', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barHeight;
          }
        }).style('opacity', 0).call(_tooltip.tooltip).call(_selected);
        (doAnimate ? bars.transition().duration(options.duration) : bars).attr('transform', function(d) {
          return "translate(0, " + (y.scale()(d.targetKey) + offset(d)) + ") scale(1,1)";
        });
        rect = bars.select('rect').style('fill', function(d) {
          return color.scale()(d.key);
        }).style('stroke', function(d) {
          return color.scale()(d.key);
        });
        (doAnimate ? rect.transition().duration(options.duration) : rect).attr('height', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barHeight;
          }
        }).attr('width', function(d) {
          return Math.abs(x.scale()(0) - x.scale()(d.targetValue));
        }).style('opacity', 1);
        bars.exit().remove();
        return bars.call(dataLabels, doAnimate, host.dataLabelStyle());
      };
      brush = function(axis, idxRange) {
        bars.attr('transform', function(d) {
          var y;
          return "translate(0, " + ((y = axis.scale()(d.key)) >= 0 ? y : -1000) + ")";
        }).selectAll('.wk-chart-rect').attr('height', function(d) {
          return axis.scale().rangeBand();
        });
        return dataLabels.brush(bars);
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('x').domainCalc('max').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        _tooltip = host.behavior().tooltip;
        _selected = host.behavior().selected;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).colorByKey(true).value(function(d) {
          return d.value;
        });
        _tooltip.on("enter." + _id, ttHelper.enter);
        return dataLabels.keyScale(_scaleList.y).valueScale(_scaleList.x);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name bars#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
        * Defines the inner and outer padding between the bars.
        *
        * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
        *
        * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
        *
        * Setting `padding="false"` is equivalent to [0,0]
       */
      attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.y.rangePadding(config);
        return host.lifeCycle().update();
      });

      /**
          @ngdoc attr
          @name bars#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the bars.
       */
      attrs.$observe('labels', function(val) {
        if (val === 'false') {
          host.showDataLabels(false);
        } else if (val === 'true' || val === "") {
          host.showDataLabels('x');
        }
        return host.lifeCycle().update();
      });

      /**
          @ngdoc attr
          @name bars#labelStyle
          @param [labelStyle=font-size:"1.3em"] {object} defined the font style attributes for the labels.
       */
      return attrs.$observe('labelStyle', function(val) {
        if (val) {
          host.dataLabelStyle(scope.$eval(val));
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name barClustered
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a clustered bar layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('barClustered', function($log, utils, barConfig, dataManagerFactory, tooltipHelperFactory) {
  var clusteredBarCntr;
  clusteredBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var barOuterPaddingOld, barPaddingOld, clusterY, config, drawBrush, drawPath, host, initial, layers, setAnimationEnd, setAnimationStart, ttEnter, ttHelper, xData, _id, _merge, _mergeLayers, _scaleList, _tooltip;
      host = controller.me;
      _id = "clusteredBar" + (clusteredBarCntr++);
      layers = null;
      clusterY = void 0;
      _merge = utils.mergeData().key(function(d) {
        return d.key;
      });
      _mergeLayers = utils.mergeData().key(function(d) {
        return d.layerKey;
      });
      barPaddingOld = 0;
      barOuterPaddingOld = 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      ttHelper = tooltipHelperFactory();
      initial = true;
      _tooltip = void 0;
      _scaleList = {};
      ttEnter = function(data) {
        var ttLayers;
        ttLayers = data.layers.map(function(l) {
          return {
            name: l.layerKey,
            value: _scaleList.x.formatValue(l.value),
            color: {
              'background-color': l.color
            }
          };
        });
        this.headerName = _scaleList.y.axisLabel();
        this.headerValue = _scaleList.y.formatValue(data.key);
        return this.layers = this.layers.concat(ttLayers);
      };
      setAnimationStart = function(data, options, x, y, color) {
        var layoutData;
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        var layoutData;
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barOuterPadding, barPadding, bars, clusterHeight, layerKeys, offset;
        barPadding = y.scale().rangeBand() / (1 - config.padding) * config.padding;
        barOuterPadding = y.scale().rangeBand() / (1 - config.outerPadding) * config.outerPadding;
        layerKeys = data.filter(function(d) {
          return !d.added && !d.deleted;
        }).map(function(d) {
          return d.layerKey;
        });
        clusterHeight = y.scale().rangeBand();
        clusterY = d3.scale.ordinal().domain(layerKeys).rangeBands([0, clusterHeight], 0, 0);
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return -barPadding / 2;
          }
          if (d.deleted) {
            return clusterHeight + barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return clusterHeight + barPadding / 2;
          }
          if (d.added) {
            return -barPadding / 2;
          }
          return 0;
        };
        if (!layers) {
          layers = this.selectAll('.wk-chart-layer');
        }
        layers = layers.data(data, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer');
        layers.exit().remove();
        bars = layers.selectAll('.wk-chart-rect').data(function(d) {
          return d.values;
        }, function(d) {
          return d.layerKey + '|' + d.key;
        });
        bars.enter().append('rect').attr('class', 'wk-chart-rect wk-chart-selectable').style('fill', function(d) {
          return color.scale()(d.layerKey);
        }).call(_tooltip.tooltip);
        (doAnimate ? bars.transition().duration(options.duration) : bars).attr('y', function(d) {
          return y.scale()(d.targetKey) + (d.added || d.deleted ? 0 : clusterY(d.layerKey)) + offset(d);
        }).attr('height', function(d) {
          if (d.layerAdded || d.layerDeleted || d.added || d.deleted) {
            return 0;
          } else {
            return clusterY.rangeBand();
          }
        }).attr('width', function(d) {
          return Math.abs(x.scale()(d.targetValue || 0));
        }).attr('x', function(d) {
          return Math.min(x.scale()(0), x.scale()(d.targetValue || 0));
        });
        bars.exit().remove();
        initial = false;
        barPaddingOld = barPadding;
        return barOuterPaddingOld = barOuterPadding;
      };
      drawBrush = function(axis, idxRange) {
        var height;
        clusterY.rangeBands([0, axis.scale().rangeBand()], 0, 0);
        height = clusterY.rangeBand();
        return layers.attr('transform', function(d) {
          var y;
          return "translate(0, " + ((y = axis.scale()(d.key)) >= 0 ? y : -1000) + ")";
        }).selectAll('.wk-chart-bar').attr('height', height).attr('y', function(d) {
          return clusterY(d.layerKey);
        });
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('x').domainCalc('max').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        this.layerScale('color');
        _tooltip = host.behavior().tooltip;
        _tooltip.on("enter." + _id, ttHelper.enter);
        return ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
      });
      host.lifeCycle().on('brushDraw', drawBrush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name barClustered#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
      * Defines the inner and outer padding between the bars.
      *
      * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
      *
      * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
      *
      * Setting `padding="false"` is equivalent to [0,0]
       */
      return attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.y.rangePadding(config);
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name barStacked
  @module wk.chart
  @restrict A
  @area api
  @description

  draws a stacked bar chart layout

  @usesDimension x [type=linear, domainRange=total] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('barStacked', function($log, utils, barConfig, dataManagerFactory, tooltipHelperFactory) {
  var stackedBarCntr;
  stackedBarCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var brush, config, drawPath, host, layers, setAnimationEnd, setAnimationStart, stack, ttHelper, xData, _id, _scaleList, _selected, _tooltip;
      host = controller.me;
      _id = "stackedBar" + (stackedBarCntr++);
      layers = null;
      _tooltip = void 0;
      _scaleList = {};
      _selected = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      ttHelper = tooltipHelperFactory();
      stack = d3.layout.stack();
      stack.values(function(d) {
        return d.values;
      }).y(function(d) {
        return d.targetValue || 0;
      }).x(function(d) {
        return d.targetKey;
      });
      setAnimationStart = function(data, options, x, y, color) {
        var layoutData;
        xData.keyScale(y).valueScale(x).data(data, true);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        var layoutData;
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barHeight, barPadding, bars, offset, stackLayout;
        if (!layers) {
          layers = this.selectAll(".wk-chart-layer");
        }
        barPadding = y.scale().rangeBand() / (1 - config.padding) * config.padding;
        stackLayout = stack(data);
        layers = layers.data(stackLayout, function(d) {
          return d.layerKey;
        });
        barHeight = y.scale().rangeBand();
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return -barPadding / 2;
          }
          if (d.deleted) {
            return barHeight + barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barHeight + barPadding / 2;
          }
          if (d.added) {
            return -barPadding / 2;
          }
          return 0;
        };
        layers.enter().append('g').attr('class', "wk-chart-layer");
        layers.exit().remove();
        bars = layers.selectAll('.wk-chart-rect');
        bars = bars.data(function(d) {
          return d.values;
        }, function(d) {
          return d.key.toString() + '|' + d.layerKey.toString();
        });
        bars.enter().append('rect').attr('class', 'wk-chart-rect wk-chart-selectable').style('opacity', 0).attr('fill', function(d) {
          return color.scale()(d.layerKey);
        }).call(_tooltip.tooltip).call(_selected);
        (doAnimate ? bars.transition().duration(options.duration) : bars).attr('x', function(d) {
          return x.scale()(d.y0);
        }).attr('width', function(d) {
          return x.scale()(d.y);
        }).attr('height', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barHeight;
          }
        }).attr('y', function(d) {
          return y.scale()(d.targetKey) + offset(d);
        }).style('opacity', 1);
        return bars.exit().remove();
      };
      brush = function(axis, idxRange) {
        var bars;
        bars = this.selectAll(".wk-chart-rect");
        if (axis.isOrdinal()) {
          bars.attr('y', function(d) {
            var val;
            if ((val = axis.scale()(d.key)) >= 0) {
              return val;
            } else {
              return -1000;
            }
          }).attr('height', function(d) {
            return axis.scale().rangeBand();
          });
          return ttHelper.brushRange(idxRange);
        } else {
          return layers.attr('d', function(d) {
            return area(d.values);
          });
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('x').domainCalc('total').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        this.layerScale('color');
        _tooltip = host.behavior().tooltip;
        _selected = host.behavior().selected;
        _tooltip.on("enter." + _id, ttHelper.enter);
        return ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
          @ngdoc attr
          @name barStacked#padding
          @values true, false, [padding, outerPadding]
          @param [padding=true] {boolean | list}
      * Defines the inner and outer padding between the bars.
      *
      * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
      *
      * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
      *
      * Setting `padding="false"` is equivalent to [0,0]
       */
      return attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.y.rangePadding(config);
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name bubble
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a bubble chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear]
  @usesDimension color [type=category20]
  @usesDimension size [type=linear]
 */
angular.module('wk.chart').directive('bubble', function($log, utils) {
  var bubbleCntr;
  bubbleCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var draw, layout, ttEnter, _id, _scaleList, _selected, _tooltip;
      layout = controller.me;
      _tooltip = void 0;
      _scaleList = {};
      _id = 'bubble' + bubbleCntr++;
      _selected = void 0;
      ttEnter = function(data) {
        var sName, scale, _results;
        _results = [];
        for (sName in _scaleList) {
          scale = _scaleList[sName];
          _results.push(this.layers.push({
            name: scale.axisLabel(),
            value: scale.formattedValue(data),
            color: sName === 'color' ? {
              'background-color': scale.map(data)
            } : void 0
          }));
        }
        return _results;
      };
      draw = function(data, options, x, y, color, size) {
        var bubbles;
        bubbles = this.selectAll('.wk-chart-bubble').data(data, function(d) {
          return color.value(d);
        });
        bubbles.enter().append('circle').attr('class', 'wk-chart-bubble wk-chart-selectable').style('opacity', 0).call(_tooltip.tooltip).call(_selected);
        bubbles.style('fill', function(d) {
          return color.map(d);
        }).transition().duration(options.duration).attr({
          r: function(d) {
            return size.map(d);
          },
          cx: function(d) {
            return x.map(d);
          },
          cy: function(d) {
            return y.map(d);
          }
        }).style('opacity', 1);
        return bubbles.exit().transition().duration(options.duration).style('opacity', 0).remove();
      };
      layout.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color', 'size']);
        this.getKind('y').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true);
        _tooltip = layout.behavior().tooltip;
        _selected = layout.behavior().selected;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      return layout.lifeCycle().on('drawChart', draw);
    }
  };
});


/**
  @ngdoc layout
  @name column
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a column chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('column', function($log, utils, barConfig, dataManagerFactory, dataLabelFactory, tooltipHelperFactory) {
  var sBarCntr;
  sBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var brush, columns, config, dataLabels, drawPath, host, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _selected, _tooltip;
      host = controller.me;
      _id = "column" + (sBarCntr++);
      columns = null;
      _scaleList = {};
      _selected = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      ttHelper = tooltipHelperFactory();
      dataLabels = dataLabelFactory();
      _tooltip = void 0;
      setAnimationStart = function(data, options, x, y, color) {
        var layoutData;
        xData.keyScale(x).valueScale(y).data(data, true);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        var layoutData;
        layoutData = xData.animationEndLayers();
        dataLabels.duration(options.duration).active(host.showDataLabels());
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barPadding, barWidth, enter, offset, rect;
        if (!columns) {
          columns = this.selectAll('.wk-chart-layer');
        }
        barWidth = x.scale().rangeBand();
        barPadding = barWidth / (1 - config.padding) * config.padding;
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return barWidth;
          }
          if (d.deleted) {
            return -barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barPadding / 2;
          }
          if (d.added) {
            return barWidth + barPadding / 2;
          }
          return 0;
        };
        columns = columns.data(data[0].values, function(d) {
          return d.key;
        });
        enter = columns.enter().append('g').attr('class', 'wk-chart-layer').attr('transform', function(d) {
          return "translate(" + (x.scale()(d.targetKey)) + ")";
        });
        enter.append('rect').attr('class', 'wk-chart-rect wk-chart-selectable').attr('width', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barWidth;
          }
        }).style('opacity', 0).call(_tooltip.tooltip).call(_selected);
        (doAnimate ? columns.transition().duration(options.duration) : columns).attr('transform', function(d) {
          return "translate(" + (x.scale()(d.targetKey) + offset(d)) + ")";
        });
        rect = columns.select('rect').style('fill', function(d) {
          return color.scale()(d.key);
        }).style('stroke', function(d) {
          return color.scale()(d.key);
        });
        (doAnimate ? rect.transition().duration(options.duration) : rect).attr('width', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barWidth;
          }
        }).attr('height', function(d) {
          return Math.abs(y.scale()(0) - y.scale()(d.targetValue));
        }).attr('y', function(d) {
          return Math.min(y.scale()(0), y.scale()(d.targetValue));
        }).style('opacity', 1);
        columns.call(dataLabels, doAnimate, host.dataLabelStyle());
        return columns.exit().remove();
      };
      brush = function(axis, idxRange) {
        columns.attr('transform', function(d) {
          var x;
          return "translate(" + ((x = axis.scale()(d.key)) >= 0 ? x : -1000) + ")";
        }).selectAll('.wk-chart-rect').attr('width', function(d) {
          return axis.scale().rangeBand();
        });
        return dataLabels.brush(columns);
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('y').domainCalc('max').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        _tooltip = host.behavior().tooltip;
        _selected = host.behavior().selected;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).colorByKey(true).value(function(d) {
          return d.value;
        });
        dataLabels.keyScale(_scaleList.x).valueScale(_scaleList.y);
        return _tooltip.on("enter." + _id, ttHelper.enter);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
      @ngdoc attr
        @name column#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
        * Defines the inner and outer padding between the bars.
        *
        * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
        *
        * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
        *
        * Setting `padding="false"` is equivalent to [0,0]
       */
      attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.x.rangePadding(config);
        return host.lifeCycle().update();
      });

      /**
          @ngdoc attr
          @name column#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the bars.
       */
      attrs.$observe('labels', function(val) {
        if (val === 'false') {
          host.showDataLabels(false);
        } else if (val === 'true' || val === "") {
          host.showDataLabels('y');
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name column#labelStyle
        @param [labelStyle=font-size:"1.3em"] {object} defined the font style attributes for the labels.
       */
      return attrs.$observe('labelStyle', function(val) {
        if (val) {
          host.dataLabelStyle(scope.$eval(val));
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name columnClustered
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a clustered column chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('columnClustered', function($log, utils, barConfig) {
  var clusteredBarCntr;
  clusteredBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var barOuterPaddingOld, barPaddingOld, clusterX, config, draw, drawBrush, host, initial, layers, ttEnter, _id, _merge, _mergeLayers, _scaleList, _tooltip;
      host = controller.me;
      _id = "clusteredColumn" + (clusteredBarCntr++);
      layers = null;
      _merge = utils.mergeData().key(function(d) {
        return d.key;
      });
      _mergeLayers = utils.mergeData().key(function(d) {
        return d.layerKey;
      });
      barPaddingOld = 0;
      barOuterPaddingOld = 0;
      config = _.clone(barConfig, true);
      drawBrush = void 0;
      clusterX = void 0;
      initial = true;
      _tooltip = void 0;
      _scaleList = {};
      ttEnter = function(data) {
        var ttLayers;
        ttLayers = data.layers.map(function(l) {
          return {
            name: l.layerKey,
            value: _scaleList.y.formatValue(l.value),
            color: {
              'background-color': l.color
            }
          };
        });
        this.headerName = _scaleList.x.axisLabel();
        this.headerValue = _scaleList.x.formatValue(data.key);
        return this.layers = this.layers.concat(ttLayers);
      };
      draw = function(data, options, x, y, color) {
        var barOuterPadding, barPadding, bars, cluster, layerKeys;
        barPadding = x.scale().rangeBand() / (1 - config.padding) * config.padding;
        barOuterPadding = x.scale().rangeBand() / (1 - config.outerPadding) * config.outerPadding;
        layerKeys = y.layerKeys(data);
        clusterX = d3.scale.ordinal().domain(y.layerKeys(data)).rangeBands([0, x.scale().rangeBand()], 0, 0);
        cluster = data.map(function(d) {
          var l;
          return l = {
            key: x.value(d),
            data: d,
            x: x.map(d),
            width: x.scale().rangeBand(x.value(d)),
            layers: layerKeys.map(function(k) {
              return {
                layerKey: k,
                color: color.scale()(k),
                key: x.value(d),
                value: d[k],
                x: clusterX(k),
                y: y.scale()(d[k]),
                height: y.scale()(0) - y.scale()(d[k]),
                width: clusterX.rangeBand(k)
              };
            })
          };
        });
        _merge(cluster).first({
          x: barPaddingOld / 2 - barOuterPadding,
          width: 0
        }).last({
          x: options.width + barPadding / 2 - barOuterPaddingOld,
          width: 0
        });
        _mergeLayers(cluster[0].layers).first({
          x: 0,
          width: 0
        }).last({
          x: cluster[0].width,
          width: 0
        });
        if (!layers) {
          layers = this.selectAll('.wk-chart-layer');
        }
        layers = layers.data(cluster, function(d) {
          return d.key;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer').call(_tooltip.tooltip).attr('transform', function(d) {
          return "translate(" + (initial ? d.x : _merge.addedPred(d).x + _merge.addedPred(d).width + barPaddingOld / 2) + ",0) scale(" + (initial ? 1 : 0) + ", 1)";
        }).style('opacity', initial ? 0 : 1);
        layers.transition().duration(options.duration).attr('transform', function(d) {
          return "translate(" + d.x + ",0) scale(1,1)";
        }).style('opacity', 1);
        layers.exit().transition().duration(options.duration).attr('transform', function(d) {
          return "translate(" + (_merge.deletedSucc(d).x - barPadding / 2) + ", 0) scale(0,1)";
        }).remove();
        bars = layers.selectAll('.wk-chart-bar').data(function(d) {
          return d.layers;
        }, function(d) {
          return d.layerKey + '|' + d.key;
        });
        bars.enter().append('rect').attr('class', 'wk-chart-bar wk-chart-selectable').attr('x', function(d) {
          if (initial) {
            return d.x;
          } else {
            return _mergeLayers.addedPred(d).x + _mergeLayers.addedPred(d).width;
          }
        }).attr('width', function(d) {
          if (initial) {
            return d.width;
          } else {
            return 0;
          }
        });
        bars.style('fill', function(d) {
          return color.scale()(d.layerKey);
        }).transition().duration(options.duration).attr('width', function(d) {
          return d.width;
        }).attr('x', function(d) {
          return d.x;
        }).attr('y', function(d) {
          return Math.min(y.scale()(0), d.y);
        }).attr('height', function(d) {
          return Math.abs(d.height);
        });
        bars.exit().transition().duration(options.duration).attr('width', 0).attr('x', function(d) {
          return _mergeLayers.deletedSucc(d).x;
        }).remove();
        initial = false;
        barPaddingOld = barPadding;
        return barOuterPaddingOld = barOuterPadding;
      };
      drawBrush = function(axis, idxRange) {
        var width;
        clusterX.rangeBands([0, axis.scale().rangeBand()], 0, 0);
        width = clusterX.rangeBand();
        return layers.attr('transform', function(d) {
          var x;
          return "translate(" + ((x = axis.scale()(d.key)) >= 0 ? x : -1000) + ",0)";
        }).selectAll('.wk-chart-bar').attr('width', width).attr('x', function(d) {
          return clusterX(d.layerKey);
        });
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('y').domainCalc('max').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        this.layerScale('color');
        _tooltip = host.behavior().tooltip;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      host.lifeCycle().on('drawChart', draw);
      host.lifeCycle().on('brushDraw', drawBrush);

      /**
        @ngdoc attr
        @name columnClustered#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
      * Defines the inner and outer padding between the bars.
      *
      * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
      *
      * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
      *
      * Setting `padding="false"` is equivalent to [0,0]
       */
      return attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.x.rangePadding(config);
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name columnStacked
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a stacked column chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=total]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('columnStacked', function($log, utils, barConfig, dataManagerFactory, markerFactory, tooltipHelperFactory) {
  var stackedColumnCntr;
  stackedColumnCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var brush, config, drawPath, host, layers, setAnimationEnd, setAnimationStart, stack, ttHelper, xData, _id, _scaleList, _selected, _tooltip;
      host = controller.me;
      _id = "stackedColumn" + (stackedColumnCntr++);
      layers = null;
      _tooltip = void 0;
      _scaleList = {};
      _selected = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      ttHelper = tooltipHelperFactory();
      stack = d3.layout.stack();
      stack.values(function(d) {
        return d.values;
      }).y(function(d) {
        return d.targetValue || 0;
      }).x(function(d) {
        return d.targetKey;
      });
      setAnimationStart = function(data, options, x, y, color) {
        var layoutData;
        xData.keyScale(x).valueScale(y).data(data, true);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        var layoutData;
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barPadding, barWidth, bars, offset, stackLayout;
        barWidth = x.scale().rangeBand();
        barPadding = barWidth / (1 - config.padding) * config.padding;
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return barWidth;
          }
          if (d.deleted) {
            return -barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barPadding / 2;
          }
          if (d.added) {
            return barWidth + barPadding / 2;
          }
          return 0;
        };
        if (!layers) {
          layers = this.selectAll(".wk-chart-layer");
        }
        stackLayout = stack(data);
        layers = layers.data(stackLayout, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', "wk-chart-layer");
        layers.exit().remove();
        bars = layers.selectAll('.wk-chart-rect');
        bars = bars.data(function(d) {
          return d.values;
        }, function(d) {
          return d.key.toString() + '|' + d.layerKey.toString();
        });
        bars.enter().append('rect').attr('class', 'wk-chart-rect wk-chart-selectable').style('opacity', 0).attr('fill', function(d) {
          return color.scale()(d.layerKey);
        }).call(_tooltip.tooltip).call(_selected);
        (doAnimate ? bars.transition().duration(options.duration) : bars).attr('y', function(d) {
          return y.scale()(d.y0 + d.y);
        }).attr('height', function(d) {
          return y.scale()(0) - y.scale()(d.y);
        }).attr('width', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barWidth;
          }
        }).attr('x', function(d) {
          return x.scale()(d.targetKey) + offset(d);
        }).style('opacity', 1);
        return bars.exit().remove();
      };
      brush = function(axis, idxRange) {
        var bars;
        bars = this.selectAll(".wk-chart-rect");
        if (axis.isOrdinal()) {
          bars.attr('x', function(d) {
            var val;
            if ((val = axis.scale()(d.key)) >= 0) {
              return val;
            } else {
              return -1000;
            }
          }).attr('width', function(d) {
            return axis.scale().rangeBand();
          });
          return ttHelper.brushRange(idxRange);
        } else {
          return layers.attr('d', function(d) {
            return area(d.values);
          });
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('y').domainCalc('total').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        this.layerScale('color');
        _tooltip = host.behavior().tooltip;
        _selected = host.behavior().selected;
        _tooltip.on("enter." + _id, ttHelper.enter);
        return ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name columnStacked#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
      * Defines the inner and outer padding between the bars.
      *
      * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
      *
      * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
      *
      * Setting `padding="false"` is equivalent to [0,0]
       */
      return attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.x.rangePadding(config);
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name gauge
  @module wk.chart
  @restrict A
  @area api
  @description

  draws a area chart layout

  @requires x
  @requires y
  @requires color
  @requires layout
 */
angular.module('wk.chart').directive('gauge', function($log, utils) {
  return {
    restrict: 'A',
    require: '^layout',
    controller: function($scope, $attrs) {
      var me;
      me = {
        chartType: 'GaugeChart',
        id: utils.getId()
      };
      $attrs.$set('chart-id', me.id);
      return me;
    },
    link: function(scope, element, attrs, controller) {
      var draw, initalShow, layout;
      layout = controller.me;
      initalShow = true;
      draw = function(data, options, x, y, color) {
        var addMarker, bar, colorDomain, dat, i, marker, ranges, yDomain, _i, _ref;
        $log.info('drawing Gauge Chart');
        dat = [data];
        yDomain = y.scale().domain();
        colorDomain = angular.copy(color.scale().domain());
        colorDomain.unshift(yDomain[0]);
        colorDomain.push(yDomain[1]);
        ranges = [];
        for (i = _i = 1, _ref = colorDomain.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
          ranges.push({
            from: +colorDomain[i - 1],
            to: +colorDomain[i]
          });
        }
        bar = this.selectAll('.wk-chart-bar');
        bar = bar.data(ranges, function(d, i) {
          return i;
        });
        if (initalShow) {
          bar.enter().append('rect').attr('class', 'wk-chart-bar').attr('x', 0).attr('width', 50).style('opacity', 0);
        } else {
          bar.enter().append('rect').attr('class', 'wk-chart-bar').attr('x', 0).attr('width', 50);
        }
        bar.transition().duration(options.duration).attr('height', function(d) {
          return y.scale()(0) - y.scale()(d.to - d.from);
        }).attr('y', function(d) {
          return y.scale()(d.to);
        }).style('fill', function(d) {
          return color.scale()(d.from);
        }).style('opacity', 1);
        bar.exit().remove();
        addMarker = function(s) {
          s.append('rect').attr('width', 55).attr('height', 4).style('fill', 'black');
          return s.append('circle').attr('r', 10).attr('cx', 65).attr('cy', 2).style('stroke', 'black');
        };
        marker = this.selectAll('.wk-chart-marker');
        marker = marker.data(dat, function(d) {
          return 'wk-chart-marker';
        });
        marker.enter().append('g').attr('class', 'wk-chart-marker').call(addMarker);
        if (initalShow) {
          marker.attr('transform', function(d) {
            return "translate(0," + (y.scale()(d.value)) + ")";
          }).style('opacity', 0);
        }
        marker.transition().duration(options.duration).attr('transform', function(d) {
          return "translate(0," + (y.scale()(d.value)) + ")";
        }).style('fill', function(d) {
          return color.scale()(d.value);
        }).style('opacity', 1);
        return initalShow = false;
      };
      layout.lifeCycle().on('configure', function() {
        this.requiredScales(['y', 'color']);
        return this.getKind('color').resetOnNewData(true);
      });
      return layout.lifeCycle().on('drawChart', draw);
    }
  };
});


/**
  @ngdoc layout
  @name geoMap
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  Draws a map form the `geoJson` data provided. Colors the map elements according to the data provided in the cart data and the mapping rules provided in the `idMap` attribute.
  The map is drawn according to the properties provided in the `projection` attribute

  For a more detailed description of the various attributes, and a reference to geoJson, projections and other relevant topic please see the {@link guide/geoMap geoMap section in the guide}

  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('geoMap', function($log, utils) {
  var mapCntr, parseList;
  mapCntr = 0;
  parseList = function(val) {
    var l;
    if (val) {
      l = val.trim().replace(/^\[|\]$/g, '').split(',').map(function(d) {
        return d.replace(/^[\"|']|[\"|']$/g, '');
      });
      l = l.map(function(d) {
        if (isNaN(d)) {
          return d;
        } else {
          return +d;
        }
      });
      if (l.length === 1) {
        return l[0];
      } else {
        return l;
      }
    }
  };
  return {
    restrict: 'A',
    require: 'layout',
    scope: {
      geojson: '=',
      projection: '='
    },
    link: function(scope, element, attrs, controller) {
      var draw, layout, pathSel, ttEnter, _dataMapping, _geoJson, _height, _id, _idProp, _path, _projection, _rotate, _scale, _scaleList, _selected, _tooltip, _width, _zoom;
      layout = controller.me;
      _tooltip = void 0;
      _selected = void 0;
      _scaleList = {};
      _id = 'geoMap' + mapCntr++;
      _dataMapping = d3.map();
      _scale = 1;
      _rotate = [0, 0];
      _idProp = '';
      ttEnter = function(data) {
        var val;
        val = _dataMapping.get(data.properties[_idProp[0]]);
        return this.layers.push({
          name: val.RS,
          value: val.DES
        });
      };
      pathSel = [];
      _projection = d3.geo.orthographic();
      _width = 0;
      _height = 0;
      _path = void 0;
      _zoom = d3.geo.zoom().projection(_projection).on("zoom.redraw", function() {
        d3.event.sourceEvent.preventDefault();
        return pathSel.attr("d", _path);
      });
      _geoJson = void 0;
      draw = function(data, options, x, y, color) {
        var e, _i, _len;
        _width = options.width;
        _height = options.height;
        if (data && data[0].hasOwnProperty(_idProp[1])) {
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            e = data[_i];
            _dataMapping.set(e[_idProp[1]], e);
          }
        }
        if (_geoJson) {
          _projection.translate([_width / 2, _height / 2]);
          pathSel = this.selectAll("path").data(_geoJson.features, function(d) {
            return d.properties[_idProp[0]];
          });
          pathSel.enter().append("svg:path").style('fill', 'lightgrey').style('stroke', 'darkgrey').call(_tooltip.tooltip).call(_selected).call(_zoom);
          pathSel.attr("d", _path).style('fill', function(d) {
            var val;
            val = _dataMapping.get(d.properties[_idProp[0]]);
            return color.map(val);
          });
          return pathSel.exit().remove();
        }
      };
      layout.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['color']);
        return _scaleList.color.resetOnNewData(true);
      });
      layout.lifeCycle().on('drawChart', draw);
      _tooltip = layout.behavior().tooltip;
      _selected = layout.behavior().selected;
      _tooltip.on("enter." + _id, ttEnter);

      /**
          @ngdoc attr
          @name geoMap#projection
          @param projection {object} sets the projection attributes for the map defined in `geojson`
       */
      scope.$watch('projection', function(val) {
        if (val !== void 0) {
          $log.log('setting Projection params', val);
          if (d3.geo.hasOwnProperty(val.projection)) {
            _projection = d3.geo[val.projection]();
            _projection.center(val.center).scale(val.scale).rotate(val.rotate).clipAngle(val.clipAngle);
            _idProp = val.idMap;
            if (_projection.parallels) {
              _projection.parallels(val.parallels);
            }
            _scale = _projection.scale();
            _rotate = _projection.rotate();
            _path = d3.geo.path().projection(_projection);
            _zoom.projection(_projection);
            return layout.lifeCycle().update();
          }
        }
      }, true);

      /**
        @ngdoc attr
        @name geoMap#geojson
        @param geojson {object} the geojson object that describes the the map.
       */
      return scope.$watch('geojson', function(val) {
        if (val !== void 0 && val !== '') {
          _geoJson = val;
          return layout.lifeCycle().update();
        }
      });
    }
  };
});


/**
  @ngdoc layout
  @name columnHistogram
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a histogram chart layout

  @usesDimension rangeX [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('columnHistogram', function($log, barConfig, utils, wkChartMargins) {
  var sHistoCntr;
  sHistoCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var brush, buckets, config, draw, host, initial, labels, ttEnter, _id, _merge, _scaleList, _selected, _tooltip;
      host = controller.me;
      _id = "histogram" + (sHistoCntr++);
      _scaleList = {};
      buckets = void 0;
      labels = void 0;
      config = {};
      _tooltip = void 0;
      _selected = void 0;
      config = _.clone(barConfig, true);
      _merge = utils.mergeData().key(function(d) {
        return d.xVal;
      });
      initial = true;
      _tooltip = void 0;
      ttEnter = function(data) {
        var lower, name, upper;
        this.headerName = _scaleList.rangeX.axisLabel();
        this.headerValue = _scaleList.y.axisLabel();
        lower = _scaleList.rangeX.formatValue(_scaleList.rangeX.lowerValue(data.data));
        if (_scaleList.rangeX.upperProperty()) {
          upper = _scaleList.rangeX.formatValue(_scaleList.rangeX.upperValue(data.data));
          name = lower + ' - ' + upper;
        } else {
          name = _scaleList.rangeX.formatValue(_scaleList.rangeX.lowerValue(data.data));
        }
        return this.layers.push({
          name: name,
          value: _scaleList.y.formattedValue(data.data),
          color: {
            'background-color': _scaleList.color.map(data.data)
          }
        });
      };
      draw = function(data, options, x, y, color, size, shape, rangeX) {
        var enter, layout, start, step, width;
        if (rangeX.upperProperty()) {
          layout = data.map(function(d) {
            return {
              x: rangeX.scale()(rangeX.lowerValue(d)),
              xVal: rangeX.lowerValue(d),
              width: rangeX.scale()(rangeX.upperValue(d)) - rangeX.scale()(rangeX.lowerValue(d)),
              y: y.map(d),
              height: options.height - y.map(d),
              color: color.map(d),
              data: d
            };
          });
        } else {
          if (data.length > 0) {
            start = rangeX.lowerValue(data[0]);
            step = rangeX.lowerValue(data[1]) - start;
            width = options.width / data.length;
            layout = data.map(function(d, i) {
              return {
                x: rangeX.scale()(start + step * i),
                xVal: rangeX.lowerValue(d),
                width: width,
                y: y.map(d),
                height: options.height - y.map(d),
                color: color.map(d),
                data: d
              };
            });
          }
        }
        _merge(layout).first({
          x: 0,
          width: 0
        }).last({
          x: options.width,
          width: 0
        });
        if (!buckets) {
          buckets = this.selectAll('.wk-chart-bucket');
        }
        buckets = buckets.data(layout, function(d) {
          return d.xVal;
        });
        enter = buckets.enter().append('g').attr('class', 'wk-chart-bucket').attr('transform', function(d) {
          return "translate(" + (initial ? d.x : _merge.addedPred(d).x + _merge.addedPred(d).width) + "," + d.y + ") scale(" + (initial ? 1 : 0) + ",1)";
        });
        enter.append('rect').attr('class', 'wk-chart-selectable').attr('height', function(d) {
          return d.height;
        }).attr('width', function(d) {
          return d.width;
        }).style('fill', function(d) {
          return d.color;
        }).style('opacity', initial ? 0 : 1).call(_tooltip.tooltip).call(_selected);
        enter.append('text').attr('class', 'wk-chart-data-label').attr('x', function(d) {
          return d.width / 2;
        }).attr('y', -wkChartMargins.dataLabelPadding.vert).attr({
          'text-anchor': 'middle'
        }).style({
          opacity: 0
        });
        buckets.transition().duration(options.duration).attr("transform", function(d) {
          return "translate(" + d.x + ", " + d.y + ") scale(1,1)";
        });
        buckets.select('rect').transition().duration(options.duration).attr('width', function(d) {
          return d.width;
        }).attr('height', function(d) {
          return d.height;
        }).style('fill', function(d) {
          return d.color;
        }).style('opacity', 1);
        buckets.select('text').text(function(d) {
          return y.formattedValue(d.data);
        }).transition().duration(options.duration).attr('x', function(d) {
          return d.width / 2;
        }).style('opacity', host.showDataLabels() ? 1 : 0);
        buckets.exit().transition().duration(options.duration).attr('transform', function(d) {
          return "translate(" + (_merge.deletedSucc(d).x) + "," + d.y + ") scale(0,1)";
        }).remove();
        return initial = false;
      };
      brush = function(axis, idxRange, width, height) {
        var bucketWidth;
        bucketWidth = function(axis, d) {
          if (axis.upperProperty()) {
            return axis.scale()(axis.upperValue(d.data)) - axis.scale()(axis.lowerValue(d.data));
          } else {
            return width / Math.max(idxRange[1] - idxRange[0] + 1, 1);
          }
        };
        buckets.attr('transform', function(d) {
          var x;
          null;
          return "translate(" + ((x = axis.scale()(d.xVal)) >= 0 ? x : -1000) + ", " + d.y + ")";
        });
        buckets.select('rect').attr('width', function(d) {
          return bucketWidth(axis, d);
        });
        return buckets.selectAll('text').attr('x', function(d) {
          return bucketWidth(axis, d) / 2;
        });
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['rangeX', 'y', 'color']);
        this.getKind('y').domainCalc('max').resetOnNewData(true);
        this.getKind('rangeX').resetOnNewData(true).scaleType('linear').domainCalc('rangeExtent');
        this.getKind('color').resetOnNewData(true);
        _tooltip = host.behavior().tooltip;
        _selected = host.behavior().selected;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      host.lifeCycle().on('drawChart', draw);
      host.lifeCycle().on('brushDraw', brush);

      /**
          @ngdoc attr
          @name columnHistogram#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the bars.
       */
      return attrs.$observe('labels', function(val) {
        if (val === 'false') {
          host.showDataLabels(false);
        } else if (val === 'true' || val === "") {
          host.showDataLabels('y');
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name line
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  Draws a horizontal line chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent] The vertical dimension
  @usesDimension color [type=category20] the line coloring dimension
 */
angular.module('wk.chart').directive('line', function($log, behavior, utils, dataManagerFactory, tooltipHelperFactory, markerFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var brush, drawPath, host, layoutData, line, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      _tooltip = void 0;
      _showMarkers = false;
      _spline = false;
      _scaleList = {};
      offset = 0;
      _id = 'line' + lineCntr++;
      line = void 0;
      markers = void 0;
      layoutData = void 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(x).valueScale(y).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var drawLines, enter, layers, moveOutside;
        offset = x.isOrdinal() ? x.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        moveOutside = (options.width / data[0].values.length) * 2;
        line = d3.svg.line().y(function(d) {
          return y.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        });
        if (_spline) {
          line.interpolate('basis');
        }
        if (x.isOrdinal()) {
          line.x(function(d) {
            if (d.highBorder) {
              return options.width + moveOutside;
            } else if (d.lowBorder) {
              return -moveOutside;
            } else {
              return x.scale()(d.targetKey);
            }
          });
        } else {
          line.x(function(d) {
            return x.scale()(d.targetKey);
          });
        }
        drawLines = function(s) {
          return s.attr('d', function(d) {
            return line(d.values);
          }).style('stroke', function(d) {
            return color.scale()(d.layerKey);
          }).style('opacity', function(d) {
            if (d.added || d.deleted) {
              return 0;
            } else {
              return 1;
            }
          }).style('pointer-events', 'none');
        };
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-line').attr('d', function(d) {
          return line(d.values);
        }).style('opacity', 0).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        });
        if (doAnimate) {
          layers.select('.wk-chart-line').attr('transform', "translate(" + offset + ")").transition().duration(options.duration).call(drawLines);
        } else {
          layers.select('.wk-chart-line').attr('transform', "translate(" + offset + ")").call(drawLines);
        }
        layers.exit().remove();
        markers.y(function(d) {
          return y.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        if (x.isOrdinal()) {
          markers.x(function(d) {
            if (d.highBorder) {
              return options.width + moveOutside;
            } else if (d.lowBorder) {
              return -moveOutside;
            } else {
              return x.scale()(d.targetKey) + x.scale().rangeBand() / 2;
            }
          });
        } else {
          markers.x(function(d) {
            return x.scale()(d.targetKey);
          });
        }
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        var lines;
        lines = this.selectAll(".wk-chart-line");
        if (axis.isOrdinal()) {
          lines.attr('d', function(d) {
            return line(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          lines.attr('d', function(d) {
            return line(d.values);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.x);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name line#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name line#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the line using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name lineVertical
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  Draws a vertical line chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent] The vertical dimension
  @usesDimension color [type=category20] the line coloring dimension
 */
angular.module('wk.chart').directive('lineVertical', function($log, utils, tooltipHelperFactory, dataManagerFactory, markerFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var brush, brushStartIdx, drawPath, host, layoutData, line, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      brushStartIdx = 0;
      _tooltip = void 0;
      _showMarkers = false;
      _spline = false;
      _scaleList = {};
      offset = 0;
      _id = 'lineVertical' + lineCntr++;
      layoutData = void 0;
      line = void 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color) {
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var drawLines, enter, layers, moveOutside;
        offset = y.isOrdinal() ? y.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        moveOutside = (options.height / data[0].values.length) * 2;
        line = d3.svg.line().x(function(d) {
          return x.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        });
        if (_spline) {
          line.interpolate('basis');
        }
        if (y.isOrdinal) {
          line.y(function(d) {
            if (d.lowBorder) {
              return options.height + moveOutside;
            } else if (d.highBorder) {
              return -moveOutside;
            } else {
              return y.scale()(d.targetKey);
            }
          });
        } else {
          line.y(function(d) {
            return y.scale()(d.targetKey);
          });
        }
        drawLines = function(s) {
          return s.attr('d', function(d) {
            return line(d.values);
          }).style('stroke', function(d) {
            return color.scale()(d.layerKey);
          }).style('opacity', function(d) {
            if (d.added || d.deleted) {
              return 0;
            } else {
              return 1;
            }
          }).style('pointer-events', 'none');
        };
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        enter = layers.enter().append('g').attr('class', "wk-chart-layer");
        enter.append('path').attr('class', 'wk-chart-line').attr('d', function(d) {
          return line(d.values);
        }).style('opacity', 0).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        });
        if (doAnimate) {
          layers.select('.wk-chart-line').attr('transform', "translate(0," + offset + ")").transition().duration(options.duration).call(drawLines);
        } else {
          layers.select('.wk-chart-line').attr('transform', "translate(0," + offset + ")").call(drawLines);
        }
        layers.exit().remove();
        markers.isVertical(true).x(function(d) {
          return x.scale()(d.layerAdded || d.layerDeleted ? 0 : d.value);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        if (y.isOrdinal) {
          markers.y(function(d) {
            if (d.lowBorder) {
              return options.height + moveOutside;
            } else if (d.highBorder) {
              return -moveOutside;
            } else {
              return y.scale()(d.targetKey) + y.scale().rangeBand() / 2;
            }
          });
        } else {
          markers.y(function(d) {
            return y.scale()(d.targetKey);
          });
        }
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        var layers;
        layers = this.selectAll(".wk-chart-line");
        if (axis.isOrdinal()) {
          layers.attr('d', function(d) {
            return line(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(0," + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          layers.attr('d', function(d) {
            return line(d.value);
          });
          return markers.brush(this);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.y);
        _tooltip.on("enter." + _id, ttHelper.enter);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name lineVertical#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name lineVertical#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the line using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name pie
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a pie chart layout

  @usesDimension size [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('pie', function($log, utils) {
  var pieCntr;
  pieCntr = 0;
  return {
    restrict: 'EA',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var animationDuration, draw, highlightSelected, initialShow, inner, labels, layout, outer, pieBox, polyline, selectionHandler, selectionOffset, ttEnter, _donat, _id, _labelStyle, _merge, _scaleList, _selected, _showLabels, _tooltip;
      layout = controller.me;
      _id = "pie" + (pieCntr++);
      inner = void 0;
      outer = void 0;
      labels = void 0;
      _labelStyle = void 0;
      pieBox = void 0;
      polyline = void 0;
      _scaleList = [];
      _selected = void 0;
      _tooltip = void 0;
      _showLabels = false;
      _donat = false;
      selectionOffset = 0;
      animationDuration = 0;
      _merge = utils.mergeData();
      ttEnter = function(data) {
        this.headerName = _scaleList.color.axisLabel();
        this.headerValue = _scaleList.size.axisLabel();
        return this.layers.push({
          name: _scaleList.color.formattedValue(data),
          value: _scaleList.size.formattedValue(data),
          color: {
            'background-color': _scaleList.color.map(data)
          }
        });
      };
      initialShow = true;
      draw = function(data, options, x, y, color, size) {
        var arcTween, innerArc, innerR, key, midAngle, outerArc, outerR, pie, r, segments;
        animationDuration = options.duration;
        r = Math.min(options.width, options.height) / 2;
        selectionOffset = r * 0.06;
        if (!pieBox) {
          pieBox = this.append('g').attr('class', 'wk-chart-pieBox');
        }
        pieBox.attr('transform', "translate(" + (options.width / 2) + "," + (options.height / 2) + ")");
        outerR = r * (_showLabels ? 0.8 : 0.9);
        innerR = outerR * (_donat ? 0.6 : 0);
        innerArc = d3.svg.arc().outerRadius(outerR).innerRadius(innerR);
        outerArc = d3.svg.arc().outerRadius(r * 0.9).innerRadius(r * 0.9);
        key = function(d) {
          return _scaleList.color.value(d.data);
        };
        pie = d3.layout.pie().sort(null).value(size.value);
        arcTween = function(a) {
          var i;
          i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return innerArc(i(t));
          };
        };
        segments = pie(data);
        _merge.key(key);
        _merge(segments).first({
          startAngle: 0,
          endAngle: 0
        }).last({
          startAngle: Math.PI * 2,
          endAngle: Math.PI * 2
        });
        if (!inner) {
          inner = pieBox.selectAll('.wk-chart-innerArc');
        }
        inner = inner.data(segments, key);
        inner.enter().append('path').each(function(d) {
          return this._current = initialShow ? d : {
            startAngle: _merge.addedPred(d).endAngle,
            endAngle: _merge.addedPred(d).endAngle
          };
        }).attr('class', 'wk-chart-innerArc wk-chart-selectable').style('fill', function(d) {
          return color.map(d.data);
        }).style('stroke', function(d) {
          return color.map(d.data);
        }).style('opacity', initialShow ? 0 : 1).call(_tooltip.tooltip).call(_selected);
        inner.transition().duration(options.duration).style('opacity', 1).attrTween('d', arcTween);
        inner.exit().datum(function(d) {
          return {
            startAngle: _merge.deletedSucc(d).startAngle,
            endAngle: _merge.deletedSucc(d).startAngle
          };
        }).transition().duration(options.duration).attrTween('d', arcTween).remove();
        midAngle = function(d) {
          return d.startAngle + (d.endAngle - d.startAngle) / 2;
        };
        if (_showLabels) {
          labels = pieBox.selectAll('.wk-chart-data-label').data(segments, key);
          labels.enter().append('text').attr('class', 'wk-chart-data-label').each(function(d) {
            return this._current = d;
          }).attr("dy", ".35em").style(layout.dataLabelStyle()).style('opacity', 0).text(function(d) {
            return size.formattedValue(d.data);
          });
          labels.transition().duration(options.duration).style('opacity', 1).text(function(d) {
            return size.formattedValue(d.data);
          }).attrTween('transform', function(d) {
            var interpolate, _this;
            _this = this;
            interpolate = d3.interpolate(_this._current, d);
            return function(t) {
              var d2, pos;
              d2 = interpolate(t);
              _this._current = d2;
              pos = outerArc.centroid(d2);
              pos[0] += 15 * (midAngle(d2) < Math.PI ? 1 : -1);
              return "translate(" + pos + ")";
            };
          }).styleTween('text-anchor', function(d) {
            var interpolate;
            interpolate = d3.interpolate(this._current, d);
            return function(t) {
              var d2;
              d2 = interpolate(t);
              if (midAngle(d2) < Math.PI) {
                return "start";
              } else {
                return "end";
              }
            };
          });
          labels.exit().transition().duration(options.duration).style('opacity', 0).remove();
          polyline = pieBox.selectAll(".wk-chart-polyline").data(segments, key);
          polyline.enter().append("polyline").attr('class', 'wk-chart-polyline').style("opacity", 0).style('pointer-events', 'none').each(function(d) {
            return this._current = d;
          });
          polyline.transition().duration(options.duration).style("opacity", function(d) {
            if (d.data.value === 0) {
              return 0;
            } else {
              return .5;
            }
          }).attrTween("points", function(d) {
            var interpolate, _this;
            this._current = this._current;
            interpolate = d3.interpolate(this._current, d);
            _this = this;
            return function(t) {
              var d2, pos;
              d2 = interpolate(t);
              _this._current = d2;
              pos = outerArc.centroid(d2);
              pos[0] += 10 * (midAngle(d2) < Math.PI ? 1 : -1);
              return [innerArc.centroid(d2), outerArc.centroid(d2), pos];
            };
          });
          polyline.exit().transition().duration(options.duration).style('opacity', 0).remove();
        } else {
          pieBox.selectAll('.wk-chart-polyline').remove();
          pieBox.selectAll('.wk-chart-data-label').remove();
        }
        return initialShow = false;
      };
      highlightSelected = function(s) {
        var arc, obj, offsX, offsY;
        obj = d3.select(this);
        if (obj.classed('wk-chart-selected')) {
          arc = (s.startAngle + s.endAngle) / 2;
          offsX = Math.sin(arc) * selectionOffset;
          offsY = -Math.cos(arc) * selectionOffset;
          return obj.transition().duration(animationDuration).attr('transform', "translate(" + offsX + "," + offsY + ")");
        } else {
          return obj.transition().duration(animationDuration).attr('transform', 'translate(0,0)');
        }
      };
      selectionHandler = function(objects) {
        return pieBox.selectAll('.wk-chart-innerArc').each(highlightSelected);
      };
      layout.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['size', 'color']);
        _scaleList.color.scaleType('category20');
        _tooltip = layout.behavior().tooltip;
        _selected = layout.behavior().selected;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      layout.lifeCycle().on('drawChart', draw);
      layout.lifeCycle().on('objectsSelected', selectionHandler);

      /**
          @ngdoc attr
          @name pie#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the pie segments.
       */
      attrs.$observe('labels', function(val) {
        if (val === 'false') {
          _showLabels = false;
        } else if (val === 'true' || val === "") {
          _showLabels = true;
        }
        return layout.lifeCycle().update();
      });
      attrs.$observe('donat', function(val) {
        if (val === 'false') {
          _donat = false;
        } else if (val === 'true' || val === "") {
          _donat = true;
        }
        return layout.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name pie#labelStyle
        @param [labelStyle=font-size:"1.3em"] {object} defined the font style attributes for the labels.
       */
      return attrs.$observe('labelStyle', function(val) {
        if (val) {
          layout.dataLabelStyle(scope.$eval(val));
        }
        return layout.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name rangeArea
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a range-area chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
  @example
 */
angular.module('wk.chart').directive('rangeArea', function($log, utils, dataManagerFactory, markerFactory, tooltipHelperFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _initialOpacity, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      _tooltip = void 0;
      _scaleList = {};
      _showMarkers = false;
      _spline = false;
      offset = 0;
      _id = 'rangearea' + lineCntr++;
      area = void 0;
      layoutData = void 0;
      _initialOpacity = 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color, size, shape, rangeX, rangeY) {
        xData.keyScale(x).valueScale(y).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color, size, shape, rangeX, rangeY]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color, size, shape, rangeX, rangeY) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color, size, shape, rangeX, rangeY]);
      };
      drawPath = function(doAnimate, data, options, x, y, color, size, shape, rangeX, rangeY) {
        var i, layers, range, rangeData;
        offset = x.isOrdinal() ? x.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        area = d3.svg.area().x(function(d) {
          return x.scale()(d.targetKey);
        }).y(function(d) {
          return y.scale()(d.value);
        }).y1(function(d) {
          return y.scale()(d.value1);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        i = 0;
        rangeData = [
          {
            values: data[1].values,
            layerKey: data[1].layerKey
          }
        ];
        while (i < rangeData[0].values.length) {
          rangeData[0].values[i].value1 = data[0].values[i].value;
          i++;
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer');
        range = this.selectAll('.wk-chart-area-path').data(rangeData, function(d) {
          return d.layerKey;
        });
        range.enter().append('path').attr('class', 'wk-chart-area-path wk-chart-edit-selectable').attr('d', function(d) {
          return area(d.values);
        }).style('opacity', _initialOpacity).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('fill', function(d) {
          return color.scale()(d.layerKey);
        }).attr('transform', "translate(" + offset + ")");
        (doAnimate ? range.transition().duration(options.duration) : range).attr('d', function(d) {
          return area(d.values);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        }).style('pointer-events', 'none');
        range.exit().remove();
        layers.exit().remove();
        markers.x(function(d) {
          return x.scale()(d.targetKey) + (x.isOrdinal() ? x.scale().rangeBand() / 2 : 0);
        }).y(function(d) {
          return y.scale()(d.value);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        var rangeArea;
        rangeArea = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          rangeArea.attr('d', function(d) {
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          rangeArea.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this, idxRange);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.x);
        _tooltip.on("enter." + _id, ttHelper.moveData);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name rangeArea#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name rangeArea#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name rangeAreaVertical
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a range-area chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
  @example
 */
angular.module('wk.chart').directive('rangeAreaVertical', function($log, utils, dataManagerFactory, markerFactory, tooltipHelperFactory) {
  var lineCntr;
  lineCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var area, brush, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _initialOpacity, _scaleList, _showMarkers, _spline, _tooltip;
      host = controller.me;
      _tooltip = void 0;
      _scaleList = {};
      _showMarkers = false;
      _spline = false;
      offset = 0;
      _id = 'rangeareavertical' + lineCntr++;
      area = void 0;
      layoutData = void 0;
      _initialOpacity = 0;
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color, size) {
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color, size) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var i, layers, range, rangeData;
        offset = y.isOrdinal() ? y.scale().rangeBand() / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        area = d3.svg.area().x(function(d) {
          return -y.scale()(d.targetKey);
        }).y(function(d) {
          return x.scale()(d.value);
        }).y1(function(d) {
          return x.scale()(d.value1);
        });
        if (_spline) {
          area.interpolate('basis');
        }
        i = 0;
        rangeData = [
          {
            values: data[1].values,
            layerKey: data[1].layerKey
          }
        ];
        while (i < rangeData[0].values.length) {
          rangeData[0].values[i].value1 = data[0].values[i].value;
          i++;
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer');
        range = this.selectAll('.wk-chart-area-path').data(rangeData, function(d) {
          return d.layerKey;
        });
        range.enter().append('path').attr('class', 'wk-chart-area-path').attr('d', function(d) {
          return area(d.values);
        }).style('opacity', _initialOpacity).style('pointer-events', 'none').style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('fill', function(d) {
          return color.scale()(d.layerKey);
        }).attr('transform', "translate(0," + offset + ")rotate(-90)");
        (doAnimate ? range.transition().duration(options.duration) : range).attr('d', function(d) {
          return area(d.values);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        }).style('pointer-events', 'none');
        range.exit().remove();
        layers.exit().remove();
        markers.y(function(d) {
          return y.scale()(d.targetKey) + (y.isOrdinal() ? y.scale().rangeBand() / 2 : 0);
        }).x(function(d) {
          return x.scale()(d.value);
        }).color(function(d) {
          return color.scale()(d.layerKey);
        });
        return layers.call(markers, doAnimate);
      };
      brush = function(axis, idxRange) {
        var rangeArea;
        rangeArea = this.selectAll(".wk-chart-area-path");
        if (axis.isOrdinal()) {
          rangeArea.attr('d', function(d) {
            return area(d.values.slice(idxRange[0], idxRange[1] + 1));
          }).attr('transform', "translate(" + (axis.scale().rangeBand() / 2) + ")");
          markers.brush(this, idxRange);
          return ttHelper.brushRange(idxRange);
        } else {
          rangeArea.attr('d', function(d) {
            return area(d.values);
          });
          return markers.brush(this, idxRange);
        }
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.layerScale('color');
        this.getKind('x').domainCalc('extent').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).domainCalc('extent');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _tooltip.markerScale(_scaleList.y);
        _tooltip.on("enter." + _id, ttHelper.moveData);
        _tooltip.on("moveData." + _id, ttHelper.moveData);
        return _tooltip.on("moveMarker." + _id, ttHelper.moveMarkers);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name rangeAreaVertical#markers
        @values true, false
        @param [markers=false] {boolean} - show a data maker icon for each data point
       */
      attrs.$observe('markers', function(val) {
        if (val === '' || val === 'true') {
          _showMarkers = true;
        } else {
          _showMarkers = false;
        }
        return host.lifeCycle().update();
      });

      /**
        @ngdoc attr
        @name rangeAreaVertical#spline
        @values true, false
        @param [spline=false] {boolean} - interpolate the area shape using bSpline
       */
      return attrs.$observe('spline', function(val) {
        if (val === '' || val === 'true') {
          _spline = true;
        } else {
          _spline = false;
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name rangeBars
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a range bar chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('rangeBars', function($log, utils, barConfig, dataManagerFactory, markerFactory, tooltipHelperFactory) {
  var sBarCntr;
  sBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var brush, config, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _selected, _showMarkers, _tooltip;
      host = controller.me;
      _id = "rangebars" + (sBarCntr++);
      _tooltip = void 0;
      _selected = void 0;
      _scaleList = {};
      _showMarkers = false;
      offset = 0;
      layoutData = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color, size) {
        xData.keyScale(y).valueScale(x).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color, size) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barHeight, barPadding, i, layers, range, rangeData;
        barHeight = y.scale().rangeBand();
        barPadding = barHeight / (1 - config.padding) * config.padding;
        offset = y.isOrdinal() ? barHeight / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return -barPadding / 2;
          }
          if (d.deleted) {
            return barHeight + barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barHeight + barPadding / 2;
          }
          if (d.added) {
            return -barPadding / 2;
          }
          return 0;
        };
        i = 0;
        rangeData = [
          {
            values: data[1].values,
            layerKey: data[1].layerKey
          }
        ];
        while (i < rangeData[0].values.length) {
          rangeData[0].values[i].value1 = data[0].values[i].targetValue;
          i++;
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer');
        range = this.selectAll('.wk-chart-rect').data(rangeData[0].values, function(d) {
          return d.key;
        });
        range.enter().append('rect').attr('class', 'wk-chart-rect').style('opacity', 0).style('fill', color.scale()(range[0].layerKey)).call(_tooltip.tooltip).call(_selected).attr('transform', function(d) {
          return "translate(0, " + (y.scale()(d.targetKey)) + ")";
        });
        (doAnimate ? range.transition().duration(options.duration) : range).attr('transform', function(d) {
          return "translate(0, " + (y.scale()(d.targetKey) + offset(d)) + ")";
        }).attr('height', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barHeight;
          }
        }).attr('width', function(d) {
          return Math.abs(x.scale()(d.targetValue) - x.scale()(d.value1));
        }).attr('x', function(d) {
          return x.scale()(d.value1);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        });
        range.exit().remove();
        return layers.exit().remove();
      };
      brush = function(axis, idxRange) {
        return this.selectAll('.wk-chart-rect').attr('transform', function(d) {
          var y;
          return "translate(0, " + ((y = axis.scale()(d.targetKey)) >= 0 ? y : -1000) + ")";
        }).selectAll('.wk-chart-rect').attr('height', function(d) {
          return axis.scale().rangeBand();
        });
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('x').domainCalc('extent').resetOnNewData(true);
        this.getKind('y').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.y).valueScale(_scaleList.x).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _selected = host.behavior().selected;
        return _tooltip.on("enter." + _id, ttHelper.enter);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
        @ngdoc attr
        @name rangeBars#padding
        @values true, false, [padding, outerPadding]
        @description bla bla
        @param [padding=true] {boolean | list}
        * Defines the inner and outer padding between the bars.
        *
        * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
        *
        * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
        *
        * Setting `padding="false"` is equivalent to [0,0]
       */
      attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.y.rangePadding(config);
        return host.lifeCycle().update();
      });

      /**
          @ngdoc attr
          @name rangeBars#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the bars.
       */
      return attrs.$observe('labels', function(val) {
        if (val === 'false') {
          host.showDataLabels(false);
        } else if (val === 'true' || val === "") {
          host.showDataLabels('x');
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name rangeColumn
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a column range chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear, domainRange=extent]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('rangeColumn', function($log, utils, barConfig, dataManagerFactory, markerFactory, tooltipHelperFactory) {
  var sBarCntr;
  sBarCntr = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var brush, config, drawPath, host, layoutData, markers, offset, setAnimationEnd, setAnimationStart, ttHelper, xData, _id, _scaleList, _selected, _showMarkers, _tooltip;
      host = controller.me;
      _id = "rangeColumn" + (sBarCntr++);
      _tooltip = void 0;
      _selected = void 0;
      _scaleList = {};
      _showMarkers = false;
      offset = 0;
      layoutData = void 0;
      config = _.clone(barConfig, true);
      xData = dataManagerFactory();
      markers = markerFactory();
      ttHelper = tooltipHelperFactory();
      setAnimationStart = function(data, options, x, y, color, size) {
        xData.keyScale(x).valueScale(y).data(data);
        if (!xData.isInitial()) {
          layoutData = xData.animationStartLayers();
          return drawPath.apply(this, [false, layoutData, options, x, y, color]);
        }
      };
      setAnimationEnd = function(data, options, x, y, color, size) {
        markers.active(_showMarkers);
        layoutData = xData.animationEndLayers();
        return drawPath.apply(this, [true, layoutData, options, x, y, color]);
      };
      drawPath = function(doAnimate, data, options, x, y, color) {
        var barHeight, barPadding, i, layers, range, rangeData;
        barHeight = x.scale().rangeBand();
        barPadding = barHeight / (1 - config.padding) * config.padding;
        offset = y.isOrdinal() ? barHeight / 2 : 0;
        if (_tooltip) {
          _tooltip.data(data);
          ttHelper.layout(data);
        }
        offset = function(d) {
          if (d.deleted && d.atBorder) {
            return barHeight;
          }
          if (d.deleted) {
            return -barPadding / 2;
          }
          if (d.added && d.atBorder) {
            return barPadding / 2;
          }
          if (d.added) {
            return barHeight + barPadding / 2;
          }
          return 0;
        };
        i = 0;
        rangeData = [
          {
            values: data[1].values,
            layerKey: data[1].layerKey
          }
        ];
        while (i < rangeData[0].values.length) {
          rangeData[0].values[i].value1 = data[0].values[i].targetValue;
          i++;
        }
        layers = this.selectAll(".wk-chart-layer").data(data, function(d) {
          return d.layerKey;
        });
        layers.enter().append('g').attr('class', 'wk-chart-layer');
        range = this.selectAll('.wk-chart-rect').data(rangeData[0].values, function(d) {
          return d.key;
        });
        range.enter().append('rect').attr('class', 'wk-chart-rect').style('opacity', 0).style('fill', color.scale()(range[0].layerKey)).call(_tooltip.tooltip).call(_selected).attr('transform', function(d) {
          return "translate(" + (x.scale()(d.targetKey)) + ")";
        });
        (doAnimate ? range.transition().duration(options.duration) : range).attr('transform', function(d) {
          return "translate(" + (x.scale()(d.targetKey) + offset(d)) + ")";
        }).attr('width', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barHeight;
          }
        }).attr('height', function(d) {
          return Math.abs(y.scale()(d.targetValue) - y.scale()(d.value1));
        }).attr('y', function(d) {
          return y.scale()(d.targetValue);
        }).style('stroke', function(d) {
          return color.scale()(d.layerKey);
        }).style('opacity', function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return 1;
          }
        });
        range.exit().remove();
        return layers.exit().remove();
      };
      brush = function(axis, idxRange) {
        return this.selectAll('.wk-chart-rect').attr('transform', function(d) {
          var x;
          return "translate(0, " + ((x = axis.scale()(d.targetKey)) >= 0 ? x : -1000) + ")";
        }).selectAll('.wk-chart-rect').attr('height', function(d) {
          return axis.scale().rangeBand();
        });
      };
      host.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).rangePadding(config).scaleType('ordinal');
        _tooltip = host.behavior().tooltip;
        ttHelper.keyScale(_scaleList.x).valueScale(_scaleList.y).colorScale(_scaleList.color).value(function(d) {
          return d.value;
        });
        _selected = host.behavior().selected;
        return _tooltip.on("enter." + _id, ttHelper.enter);
      });
      host.lifeCycle().on('brushDraw', brush);
      host.lifeCycle().on('animationStartState', setAnimationStart);
      host.lifeCycle().on('animationEndState', setAnimationEnd);

      /**
      @ngdoc attr
        @name rangeColumn#padding
        @values true, false, [padding, outerPadding]
        @param [padding=true] {boolean | list}
        * Defines the inner and outer padding between the bars.
        *
        * `padding` and `outerPadding` are measured in % of the total bar space occupied, i.e. a padding of 20 implies a bar height of 80%, padding 50 implies bar and space have the same size.
        *
        * `padding` is 10, `outerPadding` is 0 unless explicitly specified differently.
        *
        * Setting `padding="false"` is equivalent to [0,0]
       */
      attrs.$observe('padding', function(val) {
        var values;
        if (val === 'false') {
          config.padding = 0;
          config.outerPadding = 0;
        } else if (val === 'true') {
          config = _.clone(barConfig, true);
        } else {
          values = utils.parseList(val);
          if (values) {
            if (values.length === 1) {
              config.padding = values[0] / 100;
              config.outerPadding = values[0] / 100;
            }
            if (values.length === 2) {
              config.padding = values[0] / 100;
              config.outerPadding = values[1] / 100;
            }
          }
        }
        _scaleList.x.rangePadding(config);
        return host.lifeCycle().update();
      });

      /**
          @ngdoc attr
          @name rangeColumn#labels
          @values true, false
          @param [labels=true] {boolean} controls the display of data labels for each of the bars.
       */
      return attrs.$observe('labels', function(val) {
        if (val === 'false') {
          host.showDataLabels(false);
        } else if (val === 'true' || val === "") {
          host.showDataLabels('y');
        }
        return host.lifeCycle().update();
      });
    }
  };
});


/**
  @ngdoc layout
  @name scatter
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a icon chart layout

  @usesDimension x [type=linear, domainRange=extent] The horizontal dimension
  @usesDimension y [type=linear]
  @usesDimension color [type=category20]
  @usesDimension size [type=linear]
  @usesDimension shape [type=ordinal]
 */
angular.module('wk.chart').directive('scatter', function($log, utils) {
  var scatterCnt;
  scatterCnt = 0;
  return {
    restrict: 'A',
    require: '^layout',
    link: function(scope, element, attrs, controller) {
      var draw, initialOpacity, layout, ttEnter, _id, _scaleList, _selected, _tooltip;
      layout = controller.me;
      _tooltip = void 0;
      _selected = void 0;
      _id = 'scatter' + scatterCnt++;
      _scaleList = [];
      ttEnter = function(data) {
        var sName, scale, _results;
        _results = [];
        for (sName in _scaleList) {
          scale = _scaleList[sName];
          _results.push(this.layers.push({
            name: scale.axisLabel(),
            value: scale.formattedValue(data),
            color: sName === 'color' ? {
              'background-color': scale.map(data)
            } : void 0,
            path: sName === 'shape' ? d3.svg.symbol().type(scale.map(data)).size(80)() : void 0,
            "class": sName === 'shape' ? 'wk-chart-tt-svg-shape' : ''
          }));
        }
        return _results;
      };
      initialOpacity = 0;
      draw = function(data, options, x, y, color, size, shape) {
        var points;
        points = this.selectAll('.wk-chart-shape').data(data, function(d, i) {
          return i;
        });
        points.enter().append('path').attr('class', 'wk-chart-shape wk-chart-selectable').attr('transform', function(d) {
          return "translate(" + (x.map(d)) + "," + (y.map(d)) + ")";
        }).style('opacity', initialOpacity).call(_tooltip.tooltip).call(_selected);
        points.style('fill', function(d) {
          return color.map(d);
        }).attr('d', d3.svg.symbol().type(function(d) {
          return shape.map(d);
        }).size(function(d) {
          return size.map(d) * size.map(d);
        })).transition().duration(options.duration).attr('transform', function(d) {
          return "translate(" + (x.map(d)) + "," + (y.map(d)) + ")";
        }).style('opacity', 1);
        initialOpacity = 1;
        return points.exit().remove();
      };
      layout.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color', 'size', 'shape']);
        this.getKind('y').domainCalc('extent').resetOnNewData(true);
        this.getKind('x').resetOnNewData(true).domainCalc('extent');
        _tooltip = layout.behavior().tooltip;
        _selected = layout.behavior().selected;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      return layout.lifeCycle().on('drawChart', draw);
    }
  };
});


/**
  @ngdoc layout
  @name spider
  @module wk.chart
  @restrict A
  @area api
  @element layout
  @description

  draws a spider chart layout

  @usesDimension x [type=ordinal] The horizontal dimension
  @usesDimension y [type=linear, domainRange=max]
  @usesDimension color [type=category20]
 */
angular.module('wk.chart').directive('spider', function($log, utils) {
  var spiderCntr;
  spiderCntr = 0;
  return {
    restrict: 'A',
    require: 'layout',
    link: function(scope, element, attrs, controller) {
      var axis, draw, layout, ttEnter, _data, _id, _scaleList, _tooltip;
      layout = controller.me;
      _tooltip = void 0;
      _scaleList = {};
      _id = 'spider' + spiderCntr++;
      axis = d3.svg.axis();
      _data = void 0;
      ttEnter = function(data) {
        return this.layers = _data.map(function(d) {
          return {
            name: _scaleList.x.value(d),
            value: _scaleList.y.formatValue(d[data]),
            color: {
              'background-color': _scaleList.color.scale()(data)
            }
          };
        });
      };
      draw = function(data, options, x, y, color) {
        var arc, axisG, axisLabels, centerX, centerY, dataLine, dataPath, degr, lines, nbrAxis, radius, textOffs, tickLine, tickPath, ticks;
        _data = data;
        $log.log(data);
        centerX = options.width / 2;
        centerY = options.height / 2;
        radius = d3.min([centerX, centerY]) * 0.8;
        textOffs = 20;
        nbrAxis = data.length;
        arc = Math.PI * 2 / nbrAxis;
        degr = 360 / nbrAxis;
        axisG = this.select('.wk-chart-axis');
        if (axisG.empty()) {
          axisG = this.append('g').attr('class', 'wk-chart-axis');
        }
        ticks = y.scale().ticks(y.ticks());
        y.scale().range([radius, 0]);
        axis.scale(y.scale()).orient('right').tickValues(ticks).tickFormat(y.tickFormat());
        axisG.call(axis).attr('transform', "translate(" + centerX + "," + (centerY - radius) + ")");
        y.scale().range([0, radius]);
        lines = this.selectAll('.wk-chart-axis-line').data(data, function(d) {
          return d.axis;
        });
        lines.enter().append('line').attr('class', 'wk-chart-axis-line').style('stroke', 'darkgrey');
        lines.attr({
          x1: 0,
          y1: 0,
          x2: 0,
          y2: radius
        }).attr('transform', function(d, i) {
          return "translate(" + centerX + ", " + centerY + ")rotate(" + (degr * i) + ")";
        });
        lines.exit().remove();
        tickLine = d3.svg.line().x(function(d) {
          return d.x;
        }).y(function(d) {
          return d.y;
        });
        tickPath = this.selectAll('.wk-chart-tickPath').data(ticks);
        tickPath.enter().append('path').attr('class', 'wk-chart-tickPath').style('fill', 'none').style('stroke', 'lightgrey');
        tickPath.attr('d', function(d) {
          var p;
          p = data.map(function(a, i) {
            return {
              x: Math.sin(arc * i) * y.scale()(d),
              y: Math.cos(arc * i) * y.scale()(d)
            };
          });
          return tickLine(p) + 'Z';
        }).attr('transform', "translate(" + centerX + ", " + centerY + ")");
        tickPath.exit().remove();
        axisLabels = this.selectAll('.wk-chart-axis-text').data(data, function(d) {
          return x.value(d);
        });
        axisLabels.enter().append('text').attr('class', 'wk-chart-axis-text').style('fill', 'black').attr('dy', '0.8em').attr('text-anchor', 'middle');
        axisLabels.attr({
          x: function(d, i) {
            return centerX + Math.sin(arc * i) * (radius + textOffs);
          },
          y: function(d, i) {
            return centerY + Math.cos(arc * i) * (radius + textOffs);
          }
        }).text(function(d) {
          return x.value(d);
        });
        dataPath = d3.svg.line().x(function(d) {
          return d.x;
        }).y(function(d) {
          return d.y;
        });
        dataLine = this.selectAll('.wk-chart-data-line').data(y.layerKeys(data));
        dataLine.enter().append('path').attr('class', 'wk-chart-data-line').style({
          stroke: function(d) {
            return color.scale()(d);
          },
          fill: function(d) {
            return color.scale()(d);
          },
          'fill-opacity': 0.2,
          'stroke-width': 2
        }).call(_tooltip.tooltip);
        return dataLine.attr('d', function(d) {
          var p;
          p = data.map(function(a, i) {
            return {
              x: Math.sin(arc * i) * y.scale()(a[d]),
              y: Math.cos(arc * i) * y.scale()(a[d])
            };
          });
          return dataPath(p) + 'Z';
        }).attr('transform', "translate(" + centerX + ", " + centerY + ")");
      };
      layout.lifeCycle().on('configure', function() {
        _scaleList = this.getScales(['x', 'y', 'color']);
        _scaleList.y.domainCalc('max');
        _scaleList.x.resetOnNewData(true).scaleType('ordinal');
        _tooltip = layout.behavior().tooltip;
        return _tooltip.on("enter." + _id, ttEnter);
      });
      return layout.lifeCycle().on('drawChart', draw);
    }
  };
});

angular.module('wk.chart').factory('behaviorBrush', function($log, $window, selectionSharing, timing) {
  var behaviorBrush;
  behaviorBrush = function() {
    var bottom, brushEnd, brushMove, brushStart, clearSelection, getSelectedObjects, hideBrushElements, left, me, positionBrushElements, resizeExtent, right, setSelection, startBottom, startLeft, startRight, startTop, top, _active, _area, _areaBox, _areaSelection, _backgroundBox, _boundsDomain, _boundsIdx, _boundsValues, _brushEvents, _brushGroup, _brushX, _brushXY, _brushY, _chart, _container, _data, _evTargetData, _extent, _lastBottomVal, _lastLeftVal, _lastRightVal, _lastTopVal, _overlay, _selectables, _startPos, _tooltip, _x, _y;
    me = function() {};
    _active = false;
    _overlay = void 0;
    _extent = void 0;
    _startPos = void 0;
    _evTargetData = void 0;
    _area = void 0;
    _chart = void 0;
    _data = void 0;
    _areaSelection = void 0;
    _areaBox = void 0;
    _backgroundBox = void 0;
    _container = void 0;
    _selectables = void 0;
    _brushGroup = void 0;
    _x = void 0;
    _y = void 0;
    _tooltip = void 0;
    _brushXY = false;
    _brushX = false;
    _brushY = false;
    _boundsIdx = void 0;
    _boundsValues = void 0;
    _boundsDomain = [];
    _lastLeftVal = _lastRightVal = _lastBottomVal = _lastTopVal = void 0;
    _brushEvents = d3.dispatch('brushStart', 'brush', 'brushEnd');
    left = top = right = bottom = startTop = startLeft = startRight = startBottom = void 0;
    positionBrushElements = function(left, right, top, bottom) {
      var height, width;
      width = right - left;
      height = bottom - top;
      if (_brushXY) {
        _overlay.selectAll('.wk-chart-n').attr('transform', "translate(" + left + "," + top + ")").select('rect').attr('width', width);
        _overlay.selectAll('.wk-chart-s').attr('transform', "translate(" + left + "," + bottom + ")").select('rect').attr('width', width);
        _overlay.selectAll('.wk-chart-w').attr('transform', "translate(" + left + "," + top + ")").select('rect').attr('height', height);
        _overlay.selectAll('.wk-chart-e').attr('transform', "translate(" + right + "," + top + ")").select('rect').attr('height', height);
        _overlay.selectAll('.wk-chart-ne').attr('transform', "translate(" + right + "," + top + ")");
        _overlay.selectAll('.wk-chart-nw').attr('transform', "translate(" + left + "," + top + ")");
        _overlay.selectAll('.wk-chart-se').attr('transform', "translate(" + right + "," + bottom + ")");
        _overlay.selectAll('.wk-chart-sw').attr('transform', "translate(" + left + "," + bottom + ")");
        _extent.attr('width', width).attr('height', height).attr('x', left).attr('y', top);
      }
      if (_brushX) {
        _overlay.selectAll('.wk-chart-w').attr('transform', "translate(" + left + ",0)").select('rect').attr('height', height);
        _overlay.selectAll('.wk-chart-e').attr('transform', "translate(" + right + ",0)").select('rect').attr('height', height);
        _overlay.selectAll('.wk-chart-e').select('rect').attr('height', _areaBox.height);
        _overlay.selectAll('.wk-chart-w').select('rect').attr('height', _areaBox.height);
        _extent.attr('width', width).attr('height', _areaBox.height).attr('x', left).attr('y', 0);
      }
      if (_brushY) {
        _overlay.selectAll('.wk-chart-n').attr('transform', "translate(0," + top + ")").select('rect').attr('width', width);
        _overlay.selectAll('.wk-chart-s').attr('transform', "translate(0," + bottom + ")").select('rect').attr('width', width);
        _overlay.selectAll('.wk-chart-n').select('rect').attr('width', _areaBox.width);
        _overlay.selectAll('.wk-chart-s').select('rect').attr('width', _areaBox.width);
        return _extent.attr('width', _areaBox.width).attr('height', height).attr('x', 0).attr('y', top);
      }
    };
    hideBrushElements = function() {
      d3.select(_area).selectAll('.wk-chart-resize').style('display', 'none');
      return _extent.attr('width', 0).attr('height', 0).attr('x', 0).attr('y', 0).style('display', 'none');
    };
    getSelectedObjects = function() {
      var allSelected, er;
      er = _extent.node().getBoundingClientRect();
      _selectables.each(function(d) {
        var cr, xHit, yHit;
        cr = this.getBoundingClientRect();
        xHit = er.left < cr.right - cr.width / 3 && cr.left + cr.width / 3 < er.right;
        yHit = er.top < cr.bottom - cr.height / 3 && cr.top + cr.height / 3 < er.bottom;
        return d3.select(this).classed('wk-chart-selected', yHit && xHit);
      });
      allSelected = _container.selectAll('.wk-chart-selected').data();
      _container.classed('wk-chart-has-selected-items', allSelected.length > 0);
      return allSelected;
    };
    setSelection = function(left, right, top, bottom) {
      var newDomain, _bottom, _bottomVal, _left, _leftVal, _right, _rightVal, _top, _topVal;
      if (_brushX) {
        _leftVal = me.x().invert(left);
        _rightVal = me.x().invert(right);
        if (_lastLeftVal !== _leftVal || _lastRightVal !== _rightVal) {
          _lastRightVal = _rightVal;
          _lastLeftVal = _leftVal;
          _left = me.x().findIndex(_leftVal);
          _right = me.x().findIndex(_rightVal);
          _boundsIdx = [_left, _right];
          if (me.x().isOrdinal()) {
            _boundsValues = _data.map(function(d) {
              return me.x().value(d);
            }).slice(_left, _right + 1);
          } else {
            _boundsValues = [me.x().value(_data[_boundsIdx[0]]), me.x().value(_data[_right])];
          }
          _boundsDomain = _data.slice(_left, _right + 1);
          _brushEvents.brush(_boundsIdx, _boundsValues, _boundsDomain);
          selectionSharing.setSelection(_boundsValues, _boundsIdx, _brushGroup);
        }
      }
      if (_brushY) {
        _bottomVal = me.y().invert(bottom);
        _topVal = me.y().invert(top);
        if (_lastBottomVal !== _bottomVal || _lastTopVal !== _topVal) {
          _lastBottomVal = _bottomVal;
          _lastTopVal = _topVal;
          _bottom = me.y().findIndex(_bottomVal);
          _top = me.y().findIndex(_topVal);
          _boundsIdx = [_bottom, _top];
          if (me.y().isOrdinal()) {
            _boundsValues = _data.map(function(d) {
              return me.y().value(d);
            }).slice(_bottom, _top + 1);
          } else {
            _boundsValues = [me.y().value(_data[_bottom]), me.y().value(_data[_top])];
          }
          _boundsDomain = _data.slice(_bottom, _top + 1);
          _brushEvents.brush(_boundsIdx, _boundsValues, _boundsDomain);
          selectionSharing.setSelection(_boundsValues, _boundsIdx, _brushGroup);
        }
      }
      if (_brushXY) {
        newDomain = getSelectedObjects();
        if (_.xor(_boundsDomain, newDomain).length > 0) {
          _boundsIdx = [];
          _boundsValues = [];
          _boundsDomain = newDomain;
          _brushEvents.brush(_boundsIdx, _boundsValues, _boundsDomain);
          return selectionSharing.setSelection(_boundsValues, _boundsIdx, _brushGroup);
        }
      }
    };
    clearSelection = function() {
      _boundsIdx = [];
      _boundsValues = [];
      _boundsDomain = [];
      _selectables.classed('wk-chart-selected', false);
      _container.classed('wk-chart-has-selected-items', false);
      selectionSharing.setSelection(_boundsValues, _boundsIdx, _brushGroup);
      return _.delay(function() {
        _brushEvents.brush(_boundsIdx, _boundsValues, _boundsDomain);
        return _brushEvents.brushEnd(_boundsIdx, _boundsValues, _boundsDomain);
      }, 20);
    };
    brushStart = function() {
      d3.event.preventDefault();
      _evTargetData = d3.select(d3.event.target).datum();
      _(!_evTargetData ? _evTargetData = {
        name: 'forwarded'
      } : void 0);
      _areaBox = _area.getBBox();
      _startPos = d3.mouse(_area);
      startTop = top;
      startLeft = left;
      startRight = right;
      startBottom = bottom;
      d3.select(_area).style('pointer-events', 'none').selectAll(".wk-chart-resize").style("display", null);
      _extent.style('display', null);
      d3.select('body').style('cursor', d3.select(d3.event.target).style('cursor'));
      d3.select($window).on('mousemove.brush', brushMove).on('mouseup.brush', brushEnd);
      _tooltip.hide(true);
      _boundsIdx = [void 0, void 0];
      _boundsDomain = [void 0];
      _selectables = _container.selectAll('.wk-chart-selectable');
      _brushEvents.brushStart();
      timing.clear();
      return timing.init();
    };
    brushEnd = function() {
      d3.select($window).on('mousemove.brush', null);
      d3.select($window).on('mouseup.brush', null);
      d3.select(_area).style('pointer-events', 'all').selectAll('.wk-chart-resize').style('display', null);
      d3.select('body').style('cursor', null);
      _tooltip.hide(false);
      return _brushEvents.brushEnd(_boundsIdx, _boundsValues, _boundsDomain);
    };
    brushMove = function() {
      var bottomMv, deltaX, deltaY, horMv, leftMv, pos, rightMv, topMv, vertMv;
      pos = d3.mouse(_area);
      deltaX = pos[0] - _startPos[0];
      deltaY = pos[1] - _startPos[1];
      leftMv = function(delta) {
        pos = startLeft + delta;
        left = pos >= 0 ? (pos < startRight ? pos : startRight) : 0;
        return right = pos <= _areaBox.width ? (pos < startRight ? startRight : pos) : _areaBox.width;
      };
      rightMv = function(delta) {
        pos = startRight + delta;
        left = pos >= 0 ? (pos < startLeft ? pos : startLeft) : 0;
        return right = pos <= _areaBox.width ? (pos < startLeft ? startLeft : pos) : _areaBox.width;
      };
      topMv = function(delta) {
        pos = startTop + delta;
        top = pos >= 0 ? (pos < startBottom ? pos : startBottom) : 0;
        return bottom = pos <= _areaBox.height ? (pos > startBottom ? pos : startBottom) : _areaBox.height;
      };
      bottomMv = function(delta) {
        pos = startBottom + delta;
        top = pos >= 0 ? (pos < startTop ? pos : startTop) : 0;
        return bottom = pos <= _areaBox.height ? (pos > startTop ? pos : startTop) : _areaBox.height;
      };
      horMv = function(delta) {
        if (startLeft + delta >= 0) {
          if (startRight + delta <= _areaBox.width) {
            left = startLeft + delta;
            return right = startRight + delta;
          } else {
            right = _areaBox.width;
            return left = _areaBox.width - (startRight - startLeft);
          }
        } else {
          left = 0;
          return right = startRight - startLeft;
        }
      };
      vertMv = function(delta) {
        if (startTop + delta >= 0) {
          if (startBottom + delta <= _areaBox.height) {
            top = startTop + delta;
            return bottom = startBottom + delta;
          } else {
            bottom = _areaBox.height;
            return top = _areaBox.height - (startBottom - startTop);
          }
        } else {
          top = 0;
          return bottom = startBottom - startTop;
        }
      };
      switch (_evTargetData.name) {
        case 'background':
        case 'forwarded':
          if (deltaX + _startPos[0] > 0) {
            left = deltaX < 0 ? _startPos[0] + deltaX : _startPos[0];
            if (left + Math.abs(deltaX) < _areaBox.width) {
              right = left + Math.abs(deltaX);
            } else {
              right = _areaBox.width;
            }
          } else {
            left = 0;
          }
          if (deltaY + _startPos[1] > 0) {
            top = deltaY < 0 ? _startPos[1] + deltaY : _startPos[1];
            if (top + Math.abs(deltaY) < _areaBox.height) {
              bottom = top + Math.abs(deltaY);
            } else {
              bottom = _areaBox.height;
            }
          } else {
            top = 0;
          }
          break;
        case 'extent':
          vertMv(deltaY);
          horMv(deltaX);
          break;
        case 'n':
          topMv(deltaY);
          break;
        case 's':
          bottomMv(deltaY);
          break;
        case 'w':
          leftMv(deltaX);
          break;
        case 'e':
          rightMv(deltaX);
          break;
        case 'nw':
          topMv(deltaY);
          leftMv(deltaX);
          break;
        case 'ne':
          topMv(deltaY);
          rightMv(deltaX);
          break;
        case 'sw':
          bottomMv(deltaY);
          leftMv(deltaX);
          break;
        case 'se':
          bottomMv(deltaY);
          rightMv(deltaX);
      }
      positionBrushElements(left, right, top, bottom);
      return setSelection(left, right, top, bottom);
    };
    me.brush = function(s) {
      if (arguments.length === 0) {
        return _overlay;
      } else {
        if (!_active) {
          return;
        }
        _overlay = s;
        _brushXY = me.x() && me.y();
        _brushX = me.x() && !me.y();
        _brushY = me.y() && !me.x();
        s.style({
          'pointer-events': 'all',
          cursor: 'crosshair'
        });
        _extent = s.append('rect').attr({
          "class": 'wk-chart-extent',
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }).style('cursor', 'move').datum({
          name: 'extent'
        });
        if (_brushY || _brushXY) {
          s.append('g').attr('class', 'wk-chart-resize wk-chart-n').style({
            cursor: 'ns-resize',
            display: 'none'
          }).append('rect').attr({
            x: 0,
            y: -3,
            width: 0,
            height: 6
          }).datum({
            name: 'n'
          });
          s.append('g').attr('class', 'wk-chart-resize wk-chart-s').style({
            cursor: 'ns-resize',
            display: 'none'
          }).append('rect').attr({
            x: 0,
            y: -3,
            width: 0,
            height: 6
          }).datum({
            name: 's'
          });
        }
        if (_brushX || _brushXY) {
          s.append('g').attr('class', 'wk-chart-resize wk-chart-w').style({
            cursor: 'ew-resize',
            display: 'none'
          }).append('rect').attr({
            y: 0,
            x: -3,
            width: 6,
            height: 0
          }).datum({
            name: 'w'
          });
          s.append('g').attr('class', 'wk-chart-resize wk-chart-e').style({
            cursor: 'ew-resize',
            display: 'none'
          }).append('rect').attr({
            y: 0,
            x: -3,
            width: 6,
            height: 0
          }).datum({
            name: 'e'
          });
        }
        if (_brushXY) {
          s.append('g').attr('class', 'wk-chart-resize wk-chart-nw').style({
            cursor: 'nwse-resize',
            display: 'none'
          }).append('rect').attr({
            x: -3,
            y: -3,
            width: 6,
            height: 6
          }).datum({
            name: 'nw'
          });
          s.append('g').attr('class', 'wk-chart-resize wk-chart-ne').style({
            cursor: 'nesw-resize',
            display: 'none'
          }).append('rect').attr({
            x: -3,
            y: -3,
            width: 6,
            height: 6
          }).datum({
            name: 'ne'
          });
          s.append('g').attr('class', 'wk-chart-resize wk-chart-sw').style({
            cursor: 'nesw-resize',
            display: 'none'
          }).append('rect').attr({
            x: -3,
            y: -3,
            width: 6,
            height: 6
          }).datum({
            name: 'sw'
          });
          s.append('g').attr('class', 'wk-chart-resize wk-chart-se').style({
            cursor: 'nwse-resize',
            display: 'none'
          }).append('rect').attr({
            x: -3,
            y: -3,
            width: 6,
            height: 6
          }).datum({
            name: 'se'
          });
        }
        s.on('mousedown.brush', brushStart);
        return me;
      }
    };
    resizeExtent = function() {
      var horizontalRatio, newBox, verticalRatio;
      if (_areaBox) {
        newBox = _area.getBBox();
        horizontalRatio = _areaBox.width / newBox.width;
        verticalRatio = _areaBox.height / newBox.height;
        top = top / verticalRatio;
        startTop = startTop / verticalRatio;
        bottom = bottom / verticalRatio;
        startBottom = startBottom / verticalRatio;
        left = left / horizontalRatio;
        startLeft = startLeft / horizontalRatio;
        right = right / horizontalRatio;
        startRight = startRight / horizontalRatio;
        _startPos[0] = _startPos[0] / horizontalRatio;
        _startPos[1] = _startPos[1] / verticalRatio;
        _areaBox = newBox;
        return positionBrushElements(left, right, top, bottom);
      }
    };
    me.chart = function(val) {
      if (arguments.length === 0) {
        return _chart;
      } else {
        _chart = val;
        _chart.lifeCycle().on('resize.brush', resizeExtent);
        return me;
      }
    };
    me.active = function(val) {
      if (arguments.length === 0) {
        return _active;
      } else {
        _active = val;
        return me;
      }
    };
    me.x = function(val) {
      if (arguments.length === 0) {
        return _x;
      } else {
        _x = val;
        return me;
      }
    };
    me.y = function(val) {
      if (arguments.length === 0) {
        return _y;
      } else {
        _y = val;
        return me;
      }
    };
    me.area = function(val) {
      if (arguments.length === 0) {
        return _areaSelection;
      } else {
        if (!_areaSelection) {
          _areaSelection = val;
          _area = _areaSelection.node();
          me.brush(_areaSelection);
        }
        return me;
      }
    };
    me.container = function(val) {
      if (arguments.length === 0) {
        return _container;
      } else {
        _container = val;
        _selectables = _container.selectAll('.wk-chart-selectable');
        return me;
      }
    };
    me.data = function(val) {
      if (arguments.length === 0) {
        return _data;
      } else {
        _data = val;
        return me;
      }
    };
    me.brushGroup = function(val) {
      if (arguments.length === 0) {
        return _brushGroup;
      } else {
        _brushGroup = val;
        selectionSharing.createGroup(_brushGroup);
        return me;
      }
    };
    me.tooltip = function(val) {
      if (arguments.length === 0) {
        return _tooltip;
      } else {
        _tooltip = val;
        return me;
      }
    };
    me.on = function(name, callback) {
      return _brushEvents.on(name, callback);
    };
    me.extent = function() {
      return _boundsIdx;
    };
    me.events = function() {
      return _brushEvents;
    };
    me.empty = function() {
      return _boundsDomain.length === 0;
    };
    me.clearBrush = function() {
      console.log('Brush cleared');
      hideBrushElements();
      return clearSelection();
    };
    return me;
  };
  return behaviorBrush;
});

angular.module('wk.chart').factory('behavior', function($log, $window, behaviorTooltip, behaviorBrush, behaviorSelect) {
  var behavior;
  behavior = function() {
    var area, chart, container, _brush, _selection, _tooltip;
    _tooltip = behaviorTooltip();
    _brush = behaviorBrush();
    _selection = behaviorSelect();
    _brush.tooltip(_tooltip);
    area = function(area) {
      _brush.area(area);
      return _tooltip.area(area);
    };
    container = function(container) {
      _brush.container(container);
      _selection.container(container);
      return _tooltip.container(container);
    };
    chart = function(chart) {
      _brush.chart(chart);
      return _tooltip.chart(chart);
    };
    return {
      tooltip: _tooltip,
      brush: _brush,
      selected: _selection,
      overlay: area,
      container: container,
      chart: chart
    };
  };
  return behavior;
});

angular.module('wk.chart').factory('behaviorSelect', function($log) {
  var select, selectId;
  selectId = 0;
  select = function() {
    var clicked, me, _active, _container, _id, _layout, _selectionEvents;
    _id = "select" + (selectId++);
    _container = void 0;
    _layout = void 0;
    _active = false;
    _selectionEvents = d3.dispatch('selected');
    clicked = function() {
      var isSelected, obj, selectedObjects, selectedObjectsData;
      if (!_active) {
        return;
      }
      obj = d3.select(this);
      if (!_active) {
        return;
      }
      if (obj.classed('wk-chart-selectable')) {
        isSelected = obj.classed('wk-chart-selected');
        obj.classed('wk-chart-selected', !isSelected);
        selectedObjects = _container.selectAll('.wk-chart-selected');
        selectedObjectsData = selectedObjects.data().map(function(d) {
          if (d.data) {
            return d.data;
          } else {
            return d;
          }
        });
        _container.classed('wk-chart-has-selected-items', selectedObjectsData.length > 0);
        _layout.lifeCycle().objectsSelected(selectedObjects);
        return _selectionEvents.selected(selectedObjectsData);
      }
    };
    me = function(sel) {
      if (arguments.length === 0) {
        return me;
      } else {
        sel.on('click', clicked);
        return me;
      }
    };
    me.id = function() {
      return _id;
    };
    me.active = function(val) {
      if (arguments.length === 0) {
        return _active;
      } else {
        _active = val;
        return me;
      }
    };
    me.clearSelection = function() {
      $log.log('selection Cleared');
      _container.selectAll('.wk-chart-selected').classed('wk-chart-selected', false);
      _container.classed('wk-chart-has-selected-items', false);
      return _.delay(function() {
        _selectionEvents.selected([]);
        return _layout.lifeCycle().objectsSelected(_container.selectAll('.wk-chart-selected'));
      }, 20);
    };
    me.container = function(val) {
      if (arguments.length === 0) {
        return _container;
      } else {
        _container = val;
        return me;
      }
    };
    me.layout = function(val) {
      if (arguments.length === 0) {
        return _layout;
      } else {
        _layout = val;
        return me;
      }
    };
    me.events = function() {
      return _selectionEvents;
    };
    me.on = function(name, callback) {
      _selectionEvents.on(name, callback);
      return me;
    };
    return me;
  };
  return select;
});

angular.module('wk.chart').factory('behaviorTooltip', function($log, $document, $rootScope, $compile, $templateCache, wkChartTemplates) {
  var behaviorTooltip;
  behaviorTooltip = function() {
    var body, bodyRect, compileTemplate, createClosure, forwardToBrush, me, positionBox, positionInitial, tooltipEnter, tooltipLeave, tooltipMove, _active, _area, _areaSelection, _chart, _compiledTempl, _container, _data, _hide, _markerG, _markerLine, _markerScale, _path, _scales, _showMarkerLine, _templ, _templScope, _tooltipDispatch;
    _active = false;
    _path = '';
    _hide = false;
    _showMarkerLine = void 0;
    _markerG = void 0;
    _markerLine = void 0;
    _areaSelection = void 0;
    _chart = void 0;
    _area = void 0;
    _container = void 0;
    _scales = void 0;
    _markerScale = void 0;
    _data = void 0;
    _tooltipDispatch = d3.dispatch('enter', 'moveData', 'moveMarker', 'leave');
    _templ = wkChartTemplates.tooltipTemplate();
    _templScope = void 0;
    _compiledTempl = void 0;
    body = $document.find('body');
    bodyRect = body[0].getBoundingClientRect();
    me = function() {};
    positionBox = function() {
      var clientX, clientY, rect;
      rect = _compiledTempl[0].getBoundingClientRect();
      clientX = bodyRect.right - 20 > d3.event.clientX + rect.width + 10 ? d3.event.clientX + 10 : d3.event.clientX - rect.width - 10;
      clientY = bodyRect.bottom - 20 > d3.event.clientY + rect.height + 10 ? d3.event.clientY + 10 : d3.event.clientY - rect.height - 10;
      _templScope.position = {
        position: 'absolute',
        left: clientX + 'px',
        top: clientY + 'px',
        'z-index': 1500,
        opacity: 1
      };
      return _templScope.$apply();
    };
    positionInitial = function() {
      _templScope.position = {
        position: 'absolute',
        left: '0px',
        top: '0px',
        'z-index': 1500,
        opacity: 0
      };
      _templScope.$apply();
      return _.throttle(positionBox, 200);
    };
    tooltipEnter = function() {
      var dataObj, keyValue, value, _areaBox, _pos;
      if (!_active || _hide) {
        return;
      }
      body.append(_compiledTempl);
      _templScope.layers = [];
      if (_showMarkerLine) {
        _pos = d3.mouse(this);
        keyValue = _markerScale.invert(_markerScale.isHorizontal() ? _pos[0] : _pos[1]);
        dataObj = _markerScale.find(keyValue);
        _templScope.ttData = dataObj;
      } else {
        value = d3.select(this).datum();
        dataObj = _templScope.ttData = value.data ? value.data : value;
      }
      _tooltipDispatch.enter.apply(_templScope, [dataObj, dataObj]);
      positionInitial();
      if (_showMarkerLine) {
        _areaBox = _areaSelection.select('.wk-chart-background').node().getBBox();
        _pos = d3.mouse(_area);
        _markerG = _areaSelection.append('g').attr('class', 'wk-chart-tooltip-marker');
        _markerLine = _markerG.append('line');
        if (_markerScale.isHorizontal()) {
          _markerLine.attr({
            "class": 'wk-chart-marker-line',
            x0: 0,
            x1: 0,
            y0: 0,
            y1: _areaBox.height
          });
        } else {
          _markerLine.attr({
            "class": 'wk-chart-marker-line',
            x0: 0,
            x1: _areaBox.width,
            y0: 0,
            y1: 0
          });
        }
        _markerLine.style({
          stroke: 'darkgrey',
          'pointer-events': 'none'
        });
        return _tooltipDispatch.moveMarker.apply(_markerG, [keyValue, dataObj]);
      }
    };
    tooltipMove = function() {
      var dataObj, keyValue, _pos;
      if (!_active || _hide) {
        return;
      }
      _pos = d3.mouse(_area);
      positionBox();
      if (_showMarkerLine) {
        keyValue = _markerScale.invert(_markerScale.isHorizontal() ? _pos[0] : _pos[1]);
        dataObj = _markerScale.find(keyValue);
        _tooltipDispatch.moveMarker.apply(_markerG, [keyValue, dataObj]);
        _templScope.layers = [];
        _templScope.ttData = me.data()[dataObj];
        _tooltipDispatch.moveData.apply(_templScope, [keyValue, dataObj]);
      }
      return _templScope.$apply();
    };
    tooltipLeave = function() {
      if (_markerG) {
        _markerG.remove();
      }
      _markerG = void 0;
      return _compiledTempl.remove();
    };
    forwardToBrush = function(e) {
      var brush_elm, new_click_event;
      brush_elm = d3.select(_container.node().parentElement).select(".wk-chart-overlay").node();
      if (d3.event.target !== brush_elm) {
        new_click_event = new Event('mousedown');
        new_click_event.pageX = d3.event.pageX;
        new_click_event.clientX = d3.event.clientX;
        new_click_event.pageY = d3.event.pageY;
        new_click_event.clientY = d3.event.clientY;
        return brush_elm.dispatchEvent(new_click_event);
      }
    };
    me.hide = function(val) {
      if (arguments.length === 0) {
        return _hide;
      } else {
        _hide = val;
        if (_markerG) {
          _markerG.style('visibility', _hide ? 'hidden' : 'visible');
        }
        _templScope.ttShow = !_hide;
        _templScope.$apply();
        return me;
      }
    };
    me.chart = function(chart) {
      if (arguments.length === 0) {
        return _chart;
      } else {
        _chart = chart;
        return me;
      }
    };
    me.active = function(val) {
      if (arguments.length === 0) {
        return _active;
      } else {
        _active = val;
        return me;
      }
    };
    me.template = function(path) {
      var _customTempl;
      if (arguments.length === 0) {
        return _path;
      } else {
        _path = path;
        if (_path.length > 0) {
          _customTempl = $templateCache.get(_path);
          _templ = "<div class=\"wk-chart-tooltip\" ng-style=\"position\">" + _customTempl + "</div>";
        }
        return me;
      }
    };
    me.area = function(val) {
      if (arguments.length === 0) {
        return _areaSelection;
      } else {
        _areaSelection = val;
        _area = _areaSelection.node();
        if (_showMarkerLine) {
          me.tooltip(_areaSelection);
        }
        return me;
      }
    };
    me.container = function(val) {
      if (arguments.length === 0) {
        return _container;
      } else {
        _container = val;
        return me;
      }
    };
    me.markerScale = function(val) {
      if (arguments.length === 0) {
        return _markerScale;
      } else {
        if (val) {
          _showMarkerLine = true;
          _markerScale = val;
        } else {
          _showMarkerLine = false;
        }
        return me;
      }
    };
    me.data = function(val) {
      if (arguments.length === 0) {
        return _data;
      } else {
        _data = val;
        return me;
      }
    };
    me.on = function(name, callback) {
      return _tooltipDispatch.on(name, callback);
    };
    createClosure = function(scaleFn) {
      return function() {
        if (_templScope.ttData) {
          return scaleFn(_templScope.ttData);
        }
      };
    };
    compileTemplate = function(template) {
      var name, scale, _ref;
      if (!_templScope) {
        _templScope = _chart.scope().$parent.$new(true);
        _templScope.properties = {};
        _templScope.map = {};
        _templScope.scale = {};
        _templScope.label = {};
        _templScope.value = {};
        _ref = _chart.allScales().allKinds();
        for (name in _ref) {
          scale = _ref[name];
          _templScope.map[name] = createClosure(scale.map);
          _templScope.scale[name] = scale.scale();
          _templScope.properties[name] = createClosure(scale.layerKeys);
          _templScope.label[name] = scale.axisLabel();
          _templScope.value[name] = createClosure(scale.value);
        }
      }
      if (!_compiledTempl) {
        return _compiledTempl = $compile(_templ)(_templScope);
      }
    };
    me.tooltip = function(s) {
      if (arguments.length === 0) {
        return me;
      } else {
        compileTemplate(_templ);
        me.chart().lifeCycle().on('destroy.tooltip', tooltipLeave);
        s.on('mouseenter.tooltip', tooltipEnter).on('mousemove.tooltip', tooltipMove).on('mouseleave.tooltip', tooltipLeave);
        if (!s.empty() && !s.classed('wk-chart-overlay')) {
          return s.on('mousedown.tooltip', forwardToBrush);
        }
      }
    };
    return me;
  };
  return behaviorTooltip;
});

angular.module('wk.chart').factory('chart', function($log, scaleList, container, behavior, d3Animation) {
  var chart, chartCntr;
  chartCntr = 0;
  chart = function() {
    var debounced, lifecycleFull, me, _allScales, _animationDuration, _behavior, _brush, _container, _data, _editMode, _id, _layouts, _lifeCycle, _ownedScales, _scope, _showTooltip, _subTitle, _subTitleStyle, _title, _titleStyle, _toolTipTemplate;
    _id = "chart" + (chartCntr++);
    me = function() {};
    _layouts = [];
    _container = void 0;
    _allScales = void 0;
    _ownedScales = void 0;
    _data = void 0;
    _showTooltip = false;
    _scope = void 0;
    _toolTipTemplate = '';
    _title = void 0;
    _subTitle = void 0;
    _editMode = false;
    _behavior = behavior();
    _animationDuration = d3Animation.duration;
    _lifeCycle = d3.dispatch('configure', 'resize', 'prepareData', 'scaleDomains', 'rescaleDomains', 'sizeContainer', 'drawAxis', 'drawChart', 'newData', 'update', 'updateAttrs', 'scopeApply', 'destroy', 'animationStartState', 'animationEndState', 'editSelected');
    _brush = d3.dispatch('draw', 'change');
    me.id = function(id) {
      return _id;
    };
    me.scope = function(scope) {
      if (arguments.length === 0) {
        return _scope;
      } else {
        _scope = scope;
        return me;
      }
    };
    me.showTooltip = function(trueFalse) {
      if (arguments.length === 0) {
        return _showTooltip;
      } else {
        _showTooltip = trueFalse;
        _behavior.tooltip.active(_showTooltip);
        return me;
      }
    };
    me.toolTipTemplate = function(path) {
      if (arguments.length === 0) {
        return _toolTipTemplate;
      } else {
        _toolTipTemplate = path;
        _behavior.tooltip.template(path);
        return me;
      }
    };
    me.title = function(val) {
      if (arguments.length === 0) {
        return _title;
      } else {
        _title = val;
        return me;
      }
    };
    _titleStyle = {
      'font-size': '1.8em'
    };
    me.titleStyle = function(val) {
      if (arguments.length === 0) {
        return _titleStyle;
      }
      if (_.isObject(val)) {
        _.assign(_titleStyle, val);
      }
      return me;
    };
    me.subTitle = function(val) {
      if (arguments.length === 0) {
        return _subTitle;
      } else {
        _subTitle = val;
        return me;
      }
    };
    _subTitleStyle = {
      'font-size': '1.3em'
    };
    me.subTitleStyle = function(val) {
      if (arguments.length === 0) {
        return _subTitleStyle;
      }
      if (_.isObject(val)) {
        _.assign(_subTitleStyle, val);
      }
      return me;
    };
    me.addLayout = function(layout) {
      if (arguments.length === 0) {
        return _layouts;
      } else {
        _layouts.push(layout);
        return me;
      }
    };
    me.addScale = function(scale, layout) {
      _allScales.add(scale);
      if (layout) {
        layout.scales().add(scale);
      } else {
        _ownedScales.add(scale);
      }
      return me;
    };
    me.animationDuration = function(val) {
      if (arguments.length === 0) {
        return _animationDuration;
      } else {
        _animationDuration = val;
        return me;
      }
    };
    me.editMode = function(val) {
      if (arguments.length === 0) {
        return _editMode;
      }
      if (val !== _editMode) {
        _editMode = val;
        if (_editMode) {
          me.container().registerEditHooks();
        } else {
          me.container().deregisterEditHooks();
        }
      }
      return me;
    };
    me.lifeCycle = function(val) {
      return _lifeCycle;
    };
    me.layouts = function() {
      return _layouts;
    };
    me.scales = function() {
      return _ownedScales;
    };
    me.allScales = function() {
      return _allScales;
    };
    me.hasScale = function(scale) {
      return !!_allScales.has(scale);
    };
    me.container = function() {
      return _container;
    };
    me.brush = function() {
      return _brush;
    };
    me.getData = function() {
      return _data;
    };
    me.behavior = function() {
      return _behavior;
    };
    lifecycleFull = function(data, noAnimation) {
      if (data) {
        $log.log('executing full life cycle');
        _data = data;
        _scope.filteredData = data;
        _scope.scales = _allScales;
        _lifeCycle.prepareData(data, noAnimation);
        _lifeCycle.animationStartState(data);
        _lifeCycle.scaleDomains(data, noAnimation);
        _lifeCycle.sizeContainer(data, noAnimation);
        _lifeCycle.drawAxis(noAnimation);
        _lifeCycle.animationEndState(data);
        _lifeCycle.drawChart(data, noAnimation);
        _lifeCycle.scopeApply();
        return _container.registerEditHooks();
      }
    };
    debounced = _.debounce(lifecycleFull, 100);
    me.execLifeCycleFull = debounced;
    me.resizeLifeCycle = function(noAnimation) {
      if (_data) {
        $log.log('executing resize life cycle');
        _lifeCycle.sizeContainer(_data, noAnimation);
        _lifeCycle.drawAxis(noAnimation);
        _lifeCycle.drawChart(_data, noAnimation);
        return _lifeCycle.scopeApply();
      }
    };
    me.newDataLifeCycle = function(data, noAnimation) {
      if (data) {
        $log.log('executing new data life cycle');
        _data = data;
        _scope.filteredData = data;
        _lifeCycle.prepareData(data, noAnimation);
        _lifeCycle.scaleDomains(data, noAnimation);
        _lifeCycle.drawAxis(noAnimation);
        return _lifeCycle.drawChart(data, noAnimation);
      }
    };
    me.attributeChange = function(noAnimation) {
      if (_data) {
        $log.log('executing attribute change life cycle');
        _lifeCycle.sizeContainer(_data, noAnimation);
        _lifeCycle.drawAxis(noAnimation);
        return _lifeCycle.drawChart(_data, noAnimation);
      }
    };
    me.brushExtentChanged = function() {
      if (_data) {
        _lifeCycle.drawAxis(true);
        return _lifeCycle.drawChart(_data, true);
      }
    };
    me.lifeCycle().on('newData.chart', me.execLifeCycleFull);
    me.lifeCycle().on('resize.chart', me.resizeLifeCycle);
    me.lifeCycle().on('update.chart', function(noAnimation) {
      return me.execLifeCycleFull(_data, noAnimation);
    });
    me.lifeCycle().on('updateAttrs', me.attributeChange);
    me.lifeCycle().on('rescaleDomains', _lifeCycle.scaleDomains(_data, true));
    _behavior.chart(me);
    _container = container().chart(me);
    _allScales = scaleList();
    _ownedScales = scaleList();
    return me;
  };
  return chart;
});

angular.module('wk.chart').factory('container', function($log, $window, wkChartMargins, scaleList, axisConfig, d3Animation, behavior) {
  var container, containerCnt;
  containerCnt = 0;
  container = function() {
    var drawAndPositionText, drawAxis, drawGrid, drawTitleArea, getAxisRect, me, measureText, _behavior, _chart, _chartArea, _container, _containerId, _data, _duration, _element, _elementSelection, _genChartFrame, _gridArea, _innerHeight, _innerWidth, _layouts, _legends, _margin, _overlay, _removeAxis, _removeLabel, _spacedContainer, _svg, _titleHeight;
    me = function() {};
    _containerId = 'cntnr' + containerCnt++;
    _chart = void 0;
    _element = void 0;
    _elementSelection = void 0;
    _layouts = [];
    _legends = [];
    _svg = void 0;
    _container = void 0;
    _spacedContainer = void 0;
    _chartArea = void 0;
    _gridArea = void 0;
    _margin = angular.copy(wkChartMargins["default"]);
    _innerWidth = 0;
    _innerHeight = 0;
    _titleHeight = 0;
    _data = void 0;
    _overlay = void 0;
    _behavior = void 0;
    _duration = 0;
    me.id = function() {
      return _containerId;
    };
    me.chart = function(chart) {
      if (arguments.length === 0) {
        return _chart;
      } else {
        _chart = chart;
        _chart.lifeCycle().on("sizeContainer." + (me.id()), me.drawChartFrame);
        return me;
      }
    };
    me.element = function(elem) {
      var resizeTarget, _resizeHandler;
      if (arguments.length === 0) {
        return _element;
      } else {
        _resizeHandler = function() {
          return me.chart().lifeCycle().resize(true);
        };
        _element = elem;
        _elementSelection = d3.select(_element);
        if (_elementSelection.empty()) {
          $log.error("Error: Element " + _element + " does not exist");
        } else {
          _genChartFrame();
          resizeTarget = _elementSelection.select('.wk-chart').node();
          new ResizeSensor(resizeTarget, _resizeHandler);
        }
        return me;
      }
    };
    me.addLayout = function(layout) {
      _layouts.push(layout);
      return me;
    };
    me.height = function() {
      return _innerHeight;
    };
    me.width = function() {
      return _innerWidth;
    };
    me.margins = function() {
      return _margin;
    };
    me.getChartArea = function() {
      return _chartArea;
    };
    me.getOverlay = function() {
      return _overlay;
    };
    me.getContainer = function() {
      return _spacedContainer;
    };
    me.registerEditHooks = function() {
      if (_chart.editMode()) {
        me.chart().behavior().tooltip.active(false);
        _container.selectAll('.wk-chart-axis-select').each(function(d) {
          var elem, size;
          size = this.parentElement.getBBox();
          return elem = d3.select(this).attr(size);
        });
        _elementSelection.selectAll('.wk-chart-axis-select, .wk-chart-line, .wk-chart-area-path, .wk-chart-marker, .wk-chart-legend').style('pointer-events', 'all');
        return _elementSelection.selectAll('.wk-chart-axis-select, .wk-chart-label-text, .wk-chart-data-label, .wk-chart-layer, .wk-chart-innerArc, .wk-chart-legend, .wk-chart-overlay, .wk-chart-bubble, .wk-chart-shape').style('cursor', 'pointer').on('click', function(d) {
          $log.log('clicked', d3.select(this).attr('class'), d);
          return _chart.lifeCycle().editSelected(d3.select(this).attr('class'), d);
        });
      } else {
        return _container.selectAll('.wk-chart-axis-select, .wk-chart-line, .wk-chart-area-path, .wk-chart-legend').style('pointer-events', 'none').style('cursor', 'default');
      }
    };
    drawAndPositionText = function(container, text, selector, style, offset) {
      var elem;
      elem = container.select('.' + selector);
      if (elem.empty()) {
        elem = container.append('text').attr({
          "class": selector,
          'text-anchor': 'middle',
          y: offset ? offset : 0
        });
      }
      elem.text(text).style(style);
      return elem.node().getBBox().height;
    };
    drawTitleArea = function(title, subTitle) {
      var area, titleAreaHeight;
      titleAreaHeight = 0;
      area = _container.select('.wk-chart-title-area');
      if (area.empty()) {
        area = _container.append('g').attr('class', 'wk-chart-title-area wk-center-hor');
      }
      if (title) {
        _titleHeight = drawAndPositionText(area, title, 'wk-chart-title wk-chart-label-text', _chart.titleStyle());
      }
      if (subTitle) {
        drawAndPositionText(area, subTitle, 'wk-chart-subtitle wk-chart-label-text', _chart.subTitleStyle(), _titleHeight);
      }
      return area.node().getBBox().height;
    };
    measureText = function(textList, container, textClasses, style) {
      var bounds, measureContainer, t, _i, _len;
      measureContainer = container.append('g');
      for (_i = 0, _len = textList.length; _i < _len; _i++) {
        t = textList[_i];
        measureContainer.append('text').attr({
          'class': textClasses
        }).text(t).style(style);
      }
      bounds = measureContainer.node().getBBox();
      measureContainer.remove();
      return bounds;
    };
    getAxisRect = function(dim) {
      var axis, box;
      axis = _container.append('g');
      dim.range([0, 500]);
      axis.call(dim.axis());
      if (dim.rotateTickLabels()) {
        axis.selectAll("text").attr({
          dy: '0.35em'
        }).attr('transform', "rotate(" + (dim.rotateTickLabels()) + ", 0, " + (dim.axisOrient() === 'bottom' ? 10 : -10) + ")").style('text-anchor', dim.axisOrient() === 'bottom' ? 'end' : 'start');
      }
      axis.selectAll('text').style(dim.tickLabelStyle());
      box = axis.node().getBBox();
      axis.remove();
      return box;
    };
    drawAxis = function(dim) {
      var axis;
      axis = _container.select(".wk-chart-axis.wk-chart-" + (dim.axisOrient()));
      if (axis.empty()) {
        axis = _container.append('g').attr('class', 'wk-chart-axis wk-chart-' + dim.axisOrient());
        axis.append('rect').attr('class', "wk-chart-axis-select wk-chart-" + (dim.axisOrient())).style({
          opacity: 0,
          'pointer-events': 'none'
        });
      }
      axis.transition().duration(_duration).call(dim.axis());
      if (dim.rotateTickLabels()) {
        return axis.selectAll(".wk-chart-" + (dim.axisOrient()) + ".wk-chart-axis text").attr({
          dy: '0.35em'
        }).attr('transform', "rotate(" + (dim.rotateTickLabels()) + ", 0, " + (dim.axisOrient() === 'bottom' ? 10 : -10) + ")").style('text-anchor', dim.axisOrient() === 'bottom' ? 'end' : 'start').style('pointer-events', 'none').style(dim.tickLabelStyle());
      } else {
        return axis.selectAll(".wk-chart-" + (dim.axisOrient()) + ".wk-chart-axis text").attr('transform', null).style('pointer-events', 'none').style(dim.tickLabelStyle());
      }
    };
    _removeAxis = function(orient) {
      return _container.select(".wk-chart-axis.wk-chart-" + orient + ", .wk-chart-axis-select.wk-chart-" + orient).remove();
    };
    _removeLabel = function(orient) {
      return _container.select(".wk-chart-label.wk-chart-" + orient).remove();
    };
    drawGrid = function(s, noAnimation) {
      var duration, gridLines, kind, offset, ticks;
      duration = noAnimation ? 0 : _duration;
      kind = s.kind();
      ticks = s.isOrdinal() ? s.scale().range() : s.scale().ticks();
      offset = s.isOrdinal() ? s.scale().rangeBand() / 2 : 0;
      gridLines = _gridArea.selectAll(".wk-chart-grid.wk-chart-" + kind).data(ticks, function(d) {
        return d;
      });
      gridLines.enter().append('line').attr('class', "wk-chart-grid wk-chart-" + kind).style('pointer-events', 'none').style('opacity', 0);
      if (kind === 'y') {
        gridLines.transition().duration(duration).attr({
          x1: 0,
          x2: _innerWidth,
          y1: function(d) {
            if (s.isOrdinal()) {
              return d + offset;
            } else {
              return s.scale()(d);
            }
          },
          y2: function(d) {
            if (s.isOrdinal()) {
              return d + offset;
            } else {
              return s.scale()(d);
            }
          }
        }).style('opacity', 1);
      } else {
        gridLines.transition().duration(duration).attr({
          y1: 0,
          y2: _innerHeight,
          x1: function(d) {
            if (s.isOrdinal()) {
              return d + offset;
            } else {
              return s.scale()(d);
            }
          },
          x2: function(d) {
            if (s.isOrdinal()) {
              return d + offset;
            } else {
              return s.scale()(d);
            }
          }
        }).style('opacity', 1);
      }
      return gridLines.exit().transition().duration(duration).style('opacity', 0).remove();
    };
    _genChartFrame = function() {
      _svg = _elementSelection.append('div').attr('class', 'wk-chart').append('svg').attr('class', 'wk-chart');
      _svg.append('defs').append('clipPath').attr('id', "wk-chart-clip-" + _containerId).append('rect');
      _container = _svg.append('g').attr('class', 'wk-chart-container');
      _overlay = _container.append('g').attr('class', 'wk-chart-overlay').style('pointer-events', 'all');
      _overlay.append('rect').style('visibility', 'hidden').attr('class', 'wk-chart-background').datum({
        name: 'background'
      });
      _gridArea = _container.append('g').attr('class', 'wk-chart-grid-lines');
      return _chartArea = _container.append('g').attr('class', 'wk-chart-area');
    };
    me.drawChartFrame = function(data, notAnimated) {
      var axis, axisRect, bounds, dataLabelHeight, dataLabelRect, dataLabelWidth, k, l, label, labelHeight, leftMargin, s, titleAreaHeight, topMargin, _frameHeight, _frameWidth, _height, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _width;
      bounds = _elementSelection.node().getBoundingClientRect();
      _duration = notAnimated ? 0 : me.chart().animationDuration();
      _height = bounds.height;
      _width = bounds.width;
      titleAreaHeight = drawTitleArea(_chart.title(), _chart.subTitle());
      axisRect = {
        top: {
          height: 0,
          width: 0
        },
        bottom: {
          height: 0,
          width: 0
        },
        left: {
          height: 0,
          width: 0
        },
        right: {
          height: 0,
          width: 0
        }
      };
      labelHeight = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      dataLabelRect = {
        width: 0,
        height: 0
      };
      for (_i = 0, _len = _layouts.length; _i < _len; _i++) {
        l = _layouts[_i];
        dataLabelHeight = dataLabelWidth = 0;
        _ref = l.scales().allKinds();
        for (k in _ref) {
          s = _ref[k];
          if (s.showAxis()) {
            s.axis().scale(s.scale()).orient(s.axisOrient());
            axis = _container.select(".wk-chart-axis.wk-chart-" + (s.axisOrient()));
            axisRect[s.axisOrient()] = getAxisRect(s);
            label = _container.select(".wk-chart-label.wk-chart-" + (s.axisOrient()));
            if (s.showLabel()) {
              if (label.empty()) {
                label = _container.append('g').attr('class', 'wk-chart-label wk-chart-' + s.axisOrient());
              }
              labelHeight[s.axisOrient()] = drawAndPositionText(label, s.axisLabel(), 'wk-chart-label-text wk-chart-' + s.axisOrient(), s.axisLabelStyle());
            } else {
              label.remove();
            }
          }
          if (s.axisOrientOld() && s.axisOrientOld() !== s.axisOrient()) {
            _removeAxis(s.axisOrientOld());
            _removeLabel(s.axisOrientOld());
          }
          if (l.showDataLabels() === k) {
            if (s.isHorizontal()) {
              dataLabelWidth = wkChartMargins.dataLabelPadding.hor + measureText(s.formattedValue(data), _container, 'wk-chart-data-label', l.dataLabelStyle()).width;
            } else {
              dataLabelHeight = wkChartMargins.dataLabelPadding.vert + measureText(s.formattedValue(data), _container, 'wk-chart-data-label', l.dataLabelStyle()).height;
            }
          }
        }
      }
      _frameHeight = titleAreaHeight + axisRect.top.height + labelHeight.top + axisRect.bottom.height + labelHeight.bottom + _margin.top + _margin.bottom;
      _frameWidth = axisRect.right.width + labelHeight.right + axisRect.left.width + labelHeight.left + _margin.left + _margin.right;
      if (_frameHeight < _height) {
        _innerHeight = _height - _frameHeight;
      } else {
        _innerHeight = 0;
      }
      if (_frameWidth < _width) {
        _innerWidth = _width - _frameWidth;
      } else {
        _innerWidth = 0;
      }
      for (_j = 0, _len1 = _layouts.length; _j < _len1; _j++) {
        l = _layouts[_j];
        _ref1 = l.scales().allKinds();
        for (k in _ref1) {
          s = _ref1[k];
          if (k === 'x' || k === 'rangeX') {
            if (l.showDataLabels() === 'x') {
              s.range(s.reverse() ? [_innerWidth - dataLabelWidth, 0] : [0, _innerWidth - dataLabelWidth]);
            } else {
              s.range(s.reverse() ? [_innerWidth, 0] : [0, _innerWidth]);
            }
          } else if (k === 'y' || k === 'rangeY') {
            if (l.showDataLabels() === 'y') {
              s.range(s.reverse() ? [dataLabelHeight, _innerHeight] : [_innerHeight, dataLabelHeight]);
            } else {
              s.range(s.reverse() ? [0, _innerHeight] : [_innerHeight, 0]);
            }
          }
          if (s.showAxis()) {
            drawAxis(s);
          }
        }
      }
      leftMargin = axisRect.left.width + labelHeight.left + _margin.left;
      topMargin = titleAreaHeight + axisRect.top.height + labelHeight.top + _margin.top;
      _spacedContainer = _container.attr('transform', "translate(" + leftMargin + ", " + topMargin + ")");
      _svg.select("#wk-chart-clip-" + _containerId + " rect").attr('width', _innerWidth).attr('height', _innerHeight);
      _spacedContainer.select('.wk-chart-overlay>.wk-chart-background').attr('width', _innerWidth).attr('height', _innerHeight);
      _spacedContainer.select('.wk-chart-area').style('clip-path', "url(#wk-chart-clip-" + _containerId + ")");
      _container.selectAll('.wk-chart-axis.wk-chart-right').attr('transform', "translate(" + _innerWidth + ", 0)");
      _container.selectAll('.wk-chart-axis.wk-chart-bottom').attr('transform', "translate(0, " + _innerHeight + ")");
      _container.select('.wk-chart-label.wk-chart-left').attr('transform', "translate(" + (-axisRect.left.width - labelHeight.left / 2) + ", " + (_innerHeight / 2) + ") rotate(-90)");
      _container.select('.wk-chart-label.wk-chart-right').attr('transform', "translate(" + (_innerWidth + axisRect.right.width + labelHeight.right / 2) + ", " + (_innerHeight / 2) + ") rotate(90)");
      _container.select('.wk-chart-label.wk-chart-top').attr('transform', "translate(" + (_innerWidth / 2) + ", " + (-axisRect.top.height - labelHeight.top / 2) + ")");
      _container.select('.wk-chart-label.wk-chart-bottom').attr('transform', "translate(" + (_innerWidth / 2) + ", " + (_innerHeight + axisRect.bottom.height + labelHeight.bottom) + ")");
      _container.selectAll('.wk-chart-title-area').attr('transform', "translate(" + (_innerWidth / 2) + ", " + (-topMargin + _titleHeight) + ")");
      for (_k = 0, _len2 = _layouts.length; _k < _len2; _k++) {
        l = _layouts[_k];
        _ref2 = l.scales().allKinds();
        for (k in _ref2) {
          s = _ref2[k];
          if (s.showAxis() && s.showGrid()) {
            drawGrid(s);
          }
        }
      }
      _chart.behavior().overlay(_overlay);
      return _chart.behavior().container(_chartArea);
    };
    me.drawSingleAxis = function(scale) {
      var a;
      if (scale.showAxis()) {
        a = _spacedContainer.select(".wk-chart-axis.wk-chart-" + (scale.axis().orient()));
        a.call(scale.axis());
        if (scale.showGrid()) {
          drawGrid(scale, true);
        }
      }
      return me;
    };
    return me;
  };
  return container;
});

angular.module('wk.chart').factory('layout', function($log, scale, scaleList, timing) {
  var layout, layoutCntr;
  layoutCntr = 0;
  layout = function() {
    var buildArgs, getDrawArea, me, _chart, _container, _data, _dataLabelStyle, _id, _layoutLifeCycle, _scaleList, _showLabels;
    _id = "layout" + (layoutCntr++);
    _container = void 0;
    _data = void 0;
    _chart = void 0;
    _scaleList = scaleList();
    _showLabels = false;
    _layoutLifeCycle = d3.dispatch('configure', 'drawChart', 'prepareData', 'brush', 'redraw', 'drawAxis', 'update', 'updateAttrs', 'brushDraw', 'destroy', 'objectsSelected', 'animationStartState', 'animationEndState');
    me = function() {};
    me.id = function(id) {
      return _id;
    };
    me.chart = function(chart) {
      if (arguments.length === 0) {
        return _chart;
      } else {
        _chart = chart;
        _scaleList.parentScales(chart.scales());
        _chart.lifeCycle().on("configure." + (me.id()), function() {
          return _layoutLifeCycle.configure.apply(me.scales());
        });
        _chart.lifeCycle().on("drawChart." + (me.id()), me.draw);
        _chart.lifeCycle().on("prepareData." + (me.id()), me.prepareData);
        _chart.lifeCycle().on("destroy." + (me.id()), function() {
          return _layoutLifeCycle.destroy();
        });
        _chart.lifeCycle().on("animationStartState.." + (me.id()), me.animationStartState);
        _chart.lifeCycle().on("animationEndState.." + (me.id()), me.animationEndState);
        return me;
      }
    };
    me.scales = function() {
      return _scaleList;
    };
    me.scaleProperties = function() {
      return me.scales().getScaleProperties();
    };
    me.container = function(obj) {
      if (arguments.length === 0) {
        return _container;
      } else {
        _container = obj;
        return me;
      }
    };
    me.showDataLabels = function(trueFalse) {
      if (arguments.length === 0) {
        return _showLabels;
      } else {
        _showLabels = trueFalse;
        return me;
      }
    };
    _dataLabelStyle = {
      'font-size': '1.3em'
    };
    me.dataLabelStyle = function(val) {
      if (arguments.length === 0) {
        return _dataLabelStyle;
      }
      if (_.isObject(val)) {
        _.assign(_dataLabelStyle, val);
      }
      return me;
    };
    me.behavior = function() {
      return me.chart().behavior();
    };
    me.prepareData = function(data) {
      var args, kind, _i, _len, _ref;
      args = [];
      _ref = ['x', 'y', 'color', 'size', 'shape', 'rangeX', 'rangeY'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kind = _ref[_i];
        args.push(_scaleList.getKind(kind));
      }
      return _layoutLifeCycle.prepareData.apply(data, args);
    };
    me.lifeCycle = function() {
      return _layoutLifeCycle;
    };
    getDrawArea = function() {
      var container, drawArea;
      container = _container.getChartArea();
      drawArea = container.select("." + (me.id()));
      if (drawArea.empty()) {
        drawArea = container.append('g').attr('class', function(d) {
          return me.id();
        });
      }
      return drawArea;
    };
    buildArgs = function(data, notAnimated) {
      var args, kind, options, _i, _len, _ref;
      options = {
        height: _container.height(),
        width: _container.width(),
        margins: _container.margins(),
        duration: notAnimated ? 0 : me.chart().animationDuration()
      };
      args = [data, options];
      _ref = ['x', 'y', 'color', 'size', 'shape', 'rangeX', 'rangeY'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kind = _ref[_i];
        args.push(_scaleList.getKind(kind));
      }
      return args;
    };
    me.draw = function(data, notAnimated) {
      _data = data;
      _layoutLifeCycle.drawChart.apply(getDrawArea(), buildArgs(data, notAnimated));
      _layoutLifeCycle.on('redraw', me.redraw);
      _layoutLifeCycle.on('update', me.chart().lifeCycle().update);
      _layoutLifeCycle.on('drawAxis', me.chart().lifeCycle().drawAxis);
      _layoutLifeCycle.on('updateAttrs', me.chart().lifeCycle().updateAttrs);
      return _layoutLifeCycle.on('brush', function(axis, notAnimated, idxRange) {
        _container.drawSingleAxis(axis);
        return _layoutLifeCycle.brushDraw.apply(getDrawArea(), [axis, idxRange, _container.width(), _container.height()]);
      });
    };
    me.animationStartState = function(data) {
      return _layoutLifeCycle.animationStartState.apply(getDrawArea(), buildArgs(data, true));
    };
    me.animationEndState = function(data) {
      return _layoutLifeCycle.animationEndState.apply(getDrawArea(), buildArgs(data, false));
    };
    return me;
  };
  return layout;
});

angular.module('wk.chart').factory('legend', function($log, $compile, $rootScope, $templateCache, wkChartTemplates) {
  var legend, legendCnt, uniqueValues;
  legendCnt = 0;
  uniqueValues = function(arr) {
    var e, set, _i, _len;
    set = {};
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      e = arr[_i];
      set[e] = 0;
    }
    return Object.keys(set);
  };
  legend = function() {
    var destroyme, me, _containerDiv, _data, _id, _layout, _legendDiv, _legendScope, _options, _parsedTemplate, _position, _scale, _show, _showValues, _template, _templatePath, _title;
    _id = "legend-" + (legendCnt++);
    _position = 'top-right';
    _scale = void 0;
    _templatePath = void 0;
    _legendScope = $rootScope.$new(true);
    _template = void 0;
    _parsedTemplate = void 0;
    _containerDiv = void 0;
    _legendDiv = void 0;
    _title = void 0;
    _layout = void 0;
    _data = void 0;
    _options = void 0;
    _show = false;
    _showValues = false;
    me = {};
    me.position = function(pos) {
      if (arguments.length === 0) {
        return _position;
      } else {
        _position = pos;
        return me;
      }
    };
    me.show = function(val) {
      if (arguments.length === 0) {
        return _show;
      } else {
        _show = val;
        return me;
      }
    };
    me.showValues = function(val) {
      if (arguments.length === 0) {
        return _showValues;
      } else {
        _showValues = val;
        return me;
      }
    };
    me.div = function(selection) {
      if (arguments.length === 0) {
        return _legendDiv;
      } else {
        _legendDiv = selection;
        return me;
      }
    };
    me.layout = function(layout) {
      if (arguments.length === 0) {
        return _layout;
      } else {
        _layout = layout;
        return me;
      }
    };
    me.scale = function(scale) {
      if (arguments.length === 0) {
        return _scale;
      } else {
        _scale = scale;
        return me;
      }
    };
    me.title = function(title) {
      if (arguments.length === 0) {
        return _title;
      } else {
        _title = title;
        return me;
      }
    };
    me.template = function(path) {
      if (arguments.length === 0) {
        return _templatePath;
      } else {
        _templatePath = path;
        _template = $templateCache.get(_templatePath);
        _parsedTemplate = $compile(_template)(_legendScope);
        return me;
      }
    };
    me.draw = function(data, options) {
      var chartAreaRect, containerRect, layers, p, s, _i, _len, _ref, _ref1;
      _data = data;
      _options = options;
      _containerDiv = _legendDiv || d3.select(me.scale().parent().container().element()).select('.wk-chart');
      if (me.show()) {
        if (_containerDiv.select('.wk-chart-legend').empty()) {
          angular.element(_containerDiv.node()).append(_parsedTemplate);
        }
        if (me.showValues()) {
          layers = uniqueValues(_scale.value(data));
        } else {
          layers = _scale.layerKeys(data);
        }
        s = _scale.scale();
        if ((_ref = me.layout()) != null ? _ref.scales().layerScale() : void 0) {
          s = me.layout().scales().layerScale().scale();
        }
        if (_scale.kind() !== 'shape') {
          _legendScope.legendRows = layers.map(function(d) {
            return {
              value: d,
              color: {
                'background-color': s(d)
              }
            };
          });
        } else {
          _legendScope.legendRows = layers.map(function(d) {
            return {
              value: d,
              path: d3.svg.symbol().type(s(d)).size(80)()
            };
          });
        }
        _legendScope.showLegend = true;
        _legendScope.position = {
          position: _legendDiv ? 'relative' : 'absolute'
        };
        if (!_legendDiv) {
          containerRect = _containerDiv.node().getBoundingClientRect();
          chartAreaRect = _containerDiv.select('.wk-chart-overlay rect').node().getBoundingClientRect();
          _ref1 = _position.split('-');
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            p = _ref1[_i];
            _legendScope.position[p] = "" + (Math.abs(containerRect[p] - chartAreaRect[p])) + "px";
          }
        }
        _legendScope.title = _title;
      } else {
        _parsedTemplate.remove();
      }
      return me;
    };
    _parsedTemplate = $compile(wkChartTemplates.legendTemplate())(_legendScope);
    destroyme = function() {
      return _legendScope.$destroy();
    };
    me.register = function(layout) {
      layout.lifeCycle().on("drawChart." + _id, me.draw);
      layout.lifeCycle().on("destroy." + _id, destroyme);
      return me;
    };
    me.redraw = function() {
      if (_data && _options) {
        me.draw(_data, _options);
      }
      return me;
    };
    return me;
  };
  return legend;
});

var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

angular.module('wk.chart').factory('scale', function($log, legend, formatDefaults, wkChartScales, wkChartLocale) {
  var scale;
  scale = function() {
    var calcDomain, keys, layerMax, layerMin, layerTotal, me, parsedValue, _axis, _axisLabel, _axisLabelStyle, _axisOrient, _axisOrientOld, _calculatedDomain, _chart, _domain, _domainCalc, _exponent, _id, _inputFormatFn, _inputFormatString, _isHorizontal, _isOrdinal, _isVertical, _kind, _layerExclude, _layerProp, _layout, _legend, _lowerProperty, _outputFormatFn, _outputFormatString, _parent, _property, _range, _rangeOuterPadding, _rangePadding, _resetOnNewData, _reverse, _rotateTickLabels, _scale, _scaleType, _showAxis, _showGrid, _showLabel, _tickFormat, _tickLabelStyle, _tickValues, _ticks, _upperProperty;
    _id = '';
    _scale = d3.scale.linear();
    _scaleType = 'linear';
    _exponent = 1;
    _isOrdinal = false;
    _domain = void 0;
    _domainCalc = void 0;
    _calculatedDomain = void 0;
    _resetOnNewData = false;
    _property = '';
    _layerProp = '';
    _layerExclude = [];
    _lowerProperty = '';
    _upperProperty = '';
    _range = void 0;
    _rangePadding = 0.3;
    _rangeOuterPadding = 0.3;
    _inputFormatString = void 0;
    _inputFormatFn = function(data) {
      if (isNaN(+data) || _.isDate(data)) {
        return data;
      } else {
        return +data;
      }
    };
    _showAxis = false;
    _axisOrient = void 0;
    _axisOrientOld = void 0;
    _axis = void 0;
    _ticks = void 0;
    _tickFormat = void 0;
    _tickValues = void 0;
    _rotateTickLabels = void 0;
    _showLabel = false;
    _axisLabel = void 0;
    _showGrid = false;
    _reverse = false;
    _isHorizontal = false;
    _isVertical = false;
    _kind = void 0;
    _parent = void 0;
    _chart = void 0;
    _layout = void 0;
    _legend = legend();
    _outputFormatString = void 0;
    _outputFormatFn = void 0;
    _tickFormat = wkChartLocale.timeFormat.multi([
      [
        ".%L", function(d) {
          return d.getMilliseconds();
        }
      ], [
        ":%S", function(d) {
          return d.getSeconds();
        }
      ], [
        "%I:%M", function(d) {
          return d.getMinutes();
        }
      ], [
        "%I %p", function(d) {
          return d.getHours();
        }
      ], [
        "%a %d", function(d) {
          return d.getDay() && d.getDate() !== 1;
        }
      ], [
        "%b %d", function(d) {
          return d.getDate() !== 1;
        }
      ], [
        "%B", function(d) {
          return d.getMonth();
        }
      ], [
        "%Y", function() {
          return true;
        }
      ]
    ]);
    me = function() {};
    keys = function(data) {
      if (_.isArray(data)) {
        return _.reject(_.keys(data[0]), function(d) {
          return d === '$$hashKey';
        });
      } else {
        return _.reject(_.keys(data), function(d) {
          return d === '$$hashKey';
        });
      }
    };
    layerTotal = function(d, layerKeys) {
      return layerKeys.reduce(function(prev, next) {
        return +prev + +me.layerValue(d, next);
      }, 0);
    };
    layerMax = function(data, layerKeys) {
      return d3.max(data, function(d) {
        return d3.max(layerKeys, function(k) {
          return me.layerValue(d, k);
        });
      });
    };
    layerMin = function(data, layerKeys) {
      return d3.min(data, function(d) {
        return d3.min(layerKeys, function(k) {
          return me.layerValue(d, k);
        });
      });
    };
    parsedValue = function(v) {
      if (_inputFormatFn.parse) {
        return _inputFormatFn.parse(v);
      } else {
        return _inputFormatFn(v);
      }
    };
    calcDomain = {
      extent: function(data) {
        var layerKeys;
        layerKeys = me.layerKeys(data);
        return [layerMin(data, layerKeys), layerMax(data, layerKeys)];
      },
      max: function(data) {
        var layerKeys;
        layerKeys = me.layerKeys(data);
        return [0, layerMax(data, layerKeys)];
      },
      min: function(data) {
        var layerKeys;
        layerKeys = me.layerKeys(data);
        return [0, layerMin(data, layerKeys)];
      },
      totalExtent: function(data) {
        var layerKeys;
        if (data[0].hasOwnProperty('total')) {
          return d3.extent(data.map(function(d) {
            return d.total;
          }));
        } else {
          layerKeys = me.layerKeys(data);
          return d3.extent(data.map(function(d) {
            return layerTotal(d, layerKeys);
          }));
        }
      },
      total: function(data) {
        var layerKeys;
        if (data[0].hasOwnProperty('total')) {
          return [
            0, d3.max(data.map(function(d) {
              return d.total;
            }))
          ];
        } else {
          layerKeys = me.layerKeys(data);
          return [
            0, d3.max(data.map(function(d) {
              return layerTotal(d, layerKeys);
            }))
          ];
        }
      },
      rangeExtent: function(data) {
        var start, step;
        if (me.upperProperty()) {
          return [d3.min(me.lowerValue(data)), d3.max(me.upperValue(data))];
        } else {
          if (data.length > 1) {
            start = me.lowerValue(data[0]);
            step = me.lowerValue(data[1]) - start;
            return [me.lowerValue(data[0]), start + step * data.length];
          }
        }
      },
      rangeMin: function(data) {
        return [0, d3.min(me.lowerValue(data))];
      },
      rangeMax: function(data) {
        var start, step;
        if (me.upperProperty()) {
          return [0, d3.max(me.upperValue(data))];
        } else {
          start = me.lowerValue(data[0]);
          step = me.lowerValue(data[1]) - start;
          return [0, start + step * data.length];
        }
      }
    };
    me.id = function() {
      return _kind + '.' + _parent.id();
    };
    me.kind = function(kind) {
      if (arguments.length === 0) {
        return _kind;
      } else {
        _kind = kind;
        return me;
      }
    };
    me.parent = function(parent) {
      if (arguments.length === 0) {
        return _parent;
      } else {
        _parent = parent;
        return me;
      }
    };
    me.chart = function(val) {
      if (arguments.length === 0) {
        return _chart;
      } else {
        _chart = val;
        return me;
      }
    };
    me.layout = function(val) {
      if (arguments.length === 0) {
        return _layout;
      } else {
        _layout = val;
        return me;
      }
    };
    me.scale = function() {
      return _scale;
    };
    me.legend = function() {
      return _legend;
    };
    me.isOrdinal = function() {
      return _isOrdinal;
    };
    me.isHorizontal = function(trueFalse) {
      if (arguments.length === 0) {
        return _isHorizontal;
      } else {
        _isHorizontal = trueFalse;
        if (trueFalse) {
          _isVertical = false;
        }
        return me;
      }
    };
    me.isVertical = function(trueFalse) {
      if (arguments.length === 0) {
        return _isVertical;
      } else {
        _isVertical = trueFalse;
        if (trueFalse) {
          _isHorizontal = false;
        }
        return me;
      }
    };
    me.scaleType = function(type) {
      if (arguments.length === 0) {
        return _scaleType;
      } else {
        if (d3.scale.hasOwnProperty(type)) {
          _scale = d3.scale[type]();
          _scaleType = type;
          me.format(formatDefaults.number);
        } else if (type === 'time') {
          _scale = d3.time.scale();
          _scaleType = 'time';
          if (_inputFormatString) {
            me.dataFormat(_inputFormatString);
          }
          me.format(formatDefaults.date);
        } else if (wkChartScales.hasOwnProperty(type)) {
          _scaleType = type;
          _scale = wkChartScales[type]();
        } else {
          $log.error('Error: illegal scale type:', type);
        }
        _isOrdinal = _.has(_scale, 'rangeBand');
        if (_range) {
          me.range(_range);
        }
        if (_showAxis) {
          _axis.scale(_scale);
        }
        if (_exponent && _scaleType === 'pow') {
          _scale.exponent(_exponent);
        }
        return me;
      }
    };
    me.exponent = function(value) {
      if (arguments.length === 0) {
        return _exponent;
      } else {
        _exponent = value;
        if (_scaleType === 'pow') {
          _scale.exponent(_exponent);
        }
        return me;
      }
    };
    me.scaleMapFn = function(fn) {
      if (arguments.length === 0) {
        if (_scale.mapFn) {
          return _scale.mapFn();
        }
        return void 0;
      } else {
        if (_.isFunction(fn) && _scale.mapFn) {
          _scale.mapFn(fn);
        }
        return me;
      }
    };
    me.domain = function(dom) {
      if (arguments.length === 0) {
        return _domain;
      } else {
        _domain = dom;
        if (_.isArray(_domain)) {
          _scale.domain(_domain);
        }
        return me;
      }
    };
    me.domainCalc = function(rule) {
      if (arguments.length === 0) {
        if (_isOrdinal) {
          return void 0;
        } else {
          return _domainCalc;
        }
      } else {
        if (calcDomain.hasOwnProperty(rule)) {
          _domainCalc = rule;
        } else {
          $log.error('illegal domain calculation rule:', rule, " expected", _.keys(calcDomain));
        }
        return me;
      }
    };
    me.getDomain = function(data) {
      if (arguments.length === 0) {
        return _scale.domain();
      } else {
        if (!_domain && me.domainCalc()) {
          return _calculatedDomain;
        } else {
          if (_domain) {
            return _domain;
          } else {
            return me.value(data);
          }
        }
      }
    };
    me.resetOnNewData = function(trueFalse) {
      if (arguments.length === 0) {
        return _resetOnNewData;
      } else {
        _resetOnNewData = trueFalse;
        return me;
      }
    };
    me.range = function(range) {
      var _ref;
      if (arguments.length === 0) {
        return _scale.range();
      } else {
        _range = range;
        if (_isOrdinal && ((_ref = me.kind()) === 'x' || _ref === 'y' || _ref === 'rangeX' || _ref === 'rangeY')) {
          _scale.rangeBands(range, _rangePadding, _rangeOuterPadding);
        } else if (!(_scaleType === 'category10' || _scaleType === 'category20' || _scaleType === 'category20b' || _scaleType === 'category20c')) {
          _scale.range(range);
        }
        return me;
      }
    };
    me.rangePadding = function(config) {
      if (arguments.length === 0) {
        return {
          padding: _rangePadding,
          outerPadding: _rangeOuterPadding
        };
      } else {
        _rangePadding = config.padding;
        _rangeOuterPadding = config.outerPadding;
        return me;
      }
    };
    me.property = function(name) {
      if (arguments.length === 0) {
        return _property;
      } else {
        _property = name;
        return me;
      }
    };
    me.layerProperty = function(name) {
      if (arguments.length === 0) {
        return _layerProp;
      } else {
        _layerProp = name;
        return me;
      }
    };
    me.layerExclude = function(excl) {
      if (arguments.length === 0) {
        return _layerExclude;
      } else {
        _layerExclude = excl;
        return me;
      }
    };
    me.layerKeys = function(data) {
      if (_property) {
        if (_.isArray(_property)) {
          return _.intersection(_property, keys(data));
        } else {
          return [_property];
        }
      } else {
        return _.reject(keys(data), function(d) {
          return __indexOf.call(_layerExclude, d) >= 0;
        });
      }
    };
    me.lowerProperty = function(name) {
      if (arguments.length === 0) {
        return _lowerProperty;
      } else {
        _lowerProperty = name;
        return me;
      }
    };
    me.upperProperty = function(name) {
      if (arguments.length === 0) {
        return _upperProperty;
      } else {
        _upperProperty = name;
        return me;
      }
    };
    me.dataFormat = function(format) {
      if (arguments.length === 0) {
        return _inputFormatString;
      } else {
        _inputFormatString = format;
        if (_scaleType === 'time') {
          _inputFormatFn = wkChartLocale.timeFormat(format);
        } else {
          _inputFormatFn = function(d) {
            return d;
          };
        }
        return me;
      }
    };
    me.value = function(data) {
      if (_layerProp) {
        if (_.isArray(data)) {
          return data.map(function(d) {
            return parsedValue(d[_property][_layerProp]);
          });
        } else {
          return parsedValue(data[_property][_layerProp]);
        }
      } else {
        if (_.isArray(data)) {
          return data.map(function(d) {
            return parsedValue(d[_property]);
          });
        } else {
          return parsedValue(data[_property]);
        }
      }
    };
    me.layerValue = function(data, layerKey) {
      if (_layerProp) {
        return parsedValue(data[layerKey][_layerProp]);
      } else {
        return parsedValue(data[layerKey]);
      }
    };
    me.lowerValue = function(data) {
      if (_.isArray(data)) {
        return data.map(function(d) {
          return parsedValue(d[_lowerProperty]);
        });
      } else {
        return parsedValue(data[_lowerProperty]);
      }
    };
    me.upperValue = function(data) {
      if (_.isArray(data)) {
        return data.map(function(d) {
          return parsedValue(d[_upperProperty]);
        });
      } else {
        return parsedValue(data[_upperProperty]);
      }
    };
    me.formattedValue = function(data) {
      if (_.isArray(data)) {
        return data.map(function(d) {
          return me.formatValue(me.value(d));
        });
      } else {
        return me.formatValue(me.value(data));
      }
    };
    me.formattedLayerValue = function(data, layerKey) {
      if (_.isArray(data)) {
        return data.map(function(d) {
          return me.formatValue(me.layerValue(d, layerKey));
        });
      } else {
        return me.formatValue(me.layerValue(data, layerKey));
      }
    };
    me.formatValue = function(val) {
      if (_outputFormatString && val && (val.getUTCDate || !isNaN(val))) {
        return _outputFormatFn(val);
      } else {
        return val;
      }
    };
    me.map = function(data, layerKey) {
      if (layerKey) {
        if (Array.isArray(data)) {
          return data.map(function(d) {
            return _scale(me.layerValue(data, layerKey));
          });
        } else {
          return _scale(me.layerValue(data, layerKey));
        }
      } else {
        if (Array.isArray(data)) {
          return data.map(function(d) {
            return _scale(me.value(data));
          });
        } else {
          return _scale(me.value(data));
        }
      }
    };
    me.invert = function(mappedValue) {
      var domain, idx, interv, interval, range;
      if (_.has(me.scale(), 'invert')) {
        interv = (_scale.range()[1] - _scale.range()[0]) / _chart.getData().length;
        return _scale.invert(mappedValue - interv / 2);
      }
      if (_.has(me.scale(), 'invertExtent')) {
        return me.scale().invertExtent(mappedValue);
      }
      if (me.isOrdinal() && me.resetOnNewData()) {
        domain = _scale.domain();
        range = _scale.range();
        if (range[0] > range[1]) {
          interval = range[0] - range[1];
          idx = range.length - Math.floor(mappedValue / interval) - 1;
          if (idx < 0) {
            idx = 0;
          }
        } else {
          interval = range[1] - range[0];
          idx = Math.floor(mappedValue / interval);
          if (idx >= range.length) {
            idx = range.length - 1;
          }
        }
        return domain[idx];
      }
      return void 0;
    };
    me.findIndex = function(value) {
      var bisect, idx, _data;
      _data = me.chart().getData();
      if (_isOrdinal) {
        return _.findIndex(_data, function(d) {
          return value === me.value(d);
        });
      }
      if (_.isArray(value) && value.length === 2) {
        return;
      }
      bisect = d3.bisector(me.value).left;
      idx = bisect(_data, value);
      idx = idx < 0 ? 0 : idx >= _data.length ? _data.length - 1 : idx;
      return idx;
    };
    me.find = function(value) {
      return me.chart().getData()[me.findIndex(value)];
    };
    me.showAxis = function(trueFalse) {
      if (arguments.length === 0) {
        return _showAxis;
      } else {
        _showAxis = trueFalse;
        if (trueFalse) {
          _axis = d3.svg.axis();
          if (me.scaleType() === 'time') {
            _axis.tickFormat(_tickFormat);
          }
        } else {
          _axis = void 0;
        }
        return me;
      }
    };
    me.axisOrient = function(val) {
      if (arguments.length === 0) {
        return _axisOrient;
      } else {
        _axisOrientOld = _axisOrient;
        _axisOrient = val;
        return me;
      }
    };
    me.axisOrientOld = function(val) {
      if (arguments.length === 0) {
        return _axisOrientOld;
      } else {
        _axisOrientOld = val;
        return me;
      }
    };
    me.axis = function() {
      return _axis;
    };
    me.ticks = function(val) {
      if (arguments.length === 0) {
        return _ticks;
      } else {
        _ticks = val;
        if (me.axis()) {
          me.axis().ticks(_ticks);
        }
        return me;
      }
    };
    me.tickFormat = function(val) {
      if (arguments.length === 0) {
        return _tickFormat;
      } else {
        _tickFormat = val;
        if (me.axis()) {
          me.axis().tickFormat(val);
        }
        return me;
      }
    };
    me.tickValues = function(val) {
      if (arguments.length === 0) {
        return _tickValues;
      } else {
        _tickValues = val;
        if (me.axis()) {
          me.axis().tickValues(val);
        }
        return me;
      }
    };
    _tickLabelStyle = {
      'font-size': '1em'
    };
    me.tickLabelStyle = function(val) {
      if (arguments.length === 0) {
        return _tickLabelStyle;
      }
      if (_.isObject(val)) {
        _.assign(_tickLabelStyle, val);
      }
      return me;
    };
    me.showLabel = function(val) {
      if (arguments.length === 0) {
        return _showLabel;
      } else {
        _showLabel = val;
        return me;
      }
    };
    me.axisLabel = function(text) {
      if (arguments.length === 0) {
        if (_axisLabel) {
          return _axisLabel;
        } else {
          return me.property();
        }
      } else {
        _axisLabel = text;
        return me;
      }
    };
    _axisLabelStyle = {
      'font-size': '1.5em'
    };
    me.axisLabelStyle = function(val) {
      if (arguments.length === 0) {
        return _axisLabelStyle;
      }
      if (_.isObject(val)) {
        _.assign(_axisLabelStyle, val);
      }
      return me;
    };
    me.rotateTickLabels = function(nbr) {
      if (arguments.length === 0) {
        return _rotateTickLabels;
      } else {
        _rotateTickLabels = nbr;
        return me;
      }
    };
    me.format = function(val) {
      if (arguments.length === 0) {
        return _outputFormatString;
      } else {
        if (val.length > 0) {
          _outputFormatString = val;
        } else {
          _outputFormatString = me.scaleType() === 'time' ? formatDefaults.date : formatDefaults.number;
        }
        _outputFormatFn = me.scaleType() === 'time' ? wkChartLocale.timeFormat(_outputFormatString) : wkChartLocale.numberFormat(_outputFormatString);
        return me;
      }
    };
    me.showGrid = function(trueFalse) {
      if (arguments.length === 0) {
        return _showGrid;
      } else {
        _showGrid = trueFalse;
        return me;
      }
    };
    me.reverse = function(trueFalse) {
      if (arguments.length === 0) {
        return _reverse;
      } else {
        _reverse = trueFalse;
        return me;
      }
    };
    me.register = function() {
      me.chart().lifeCycle().on("scaleDomains." + (me.id()), function(data) {
        var domain;
        if (me.resetOnNewData()) {
          domain = me.getDomain(data);
          if (_scaleType === 'linear' && _.some(domain, isNaN)) {
            throw "Scale " + (me.kind()) + ", Type '" + _scaleType + "': cannot compute domain for property '" + _property + "' . Possible reasons: property not set, data not compatible with defined type. Domain:" + domain;
          }
          return _scale.domain(domain);
        }
      });
      return me.chart().lifeCycle().on("prepareData." + (me.id()), function(data) {
        var calcRule;
        calcRule = me.domainCalc();
        if (me.parent().scaleProperties) {
          me.layerExclude(me.parent().scaleProperties());
        }
        if (calcRule && calcDomain[calcRule]) {
          return _calculatedDomain = calcDomain[calcRule](data);
        }
      });
    };
    me.update = function(noAnimation) {
      me.parent().lifeCycle().update(noAnimation);
      return me;
    };
    me.updateAttrs = function() {
      return me.parent().lifeCycle().updateAttrs();
    };
    me.drawAxis = function() {
      me.parent().lifeCycle().drawAxis();
      return me;
    };
    return me;
  };
  return scale;
});

angular.module('wk.chart').factory('scaleList', function($log) {
  var scaleList;
  return scaleList = function() {
    var me, _kindList, _layerScale, _list, _owner, _parentList, _requiredScales;
    _list = {};
    _kindList = {};
    _parentList = {};
    _owner = void 0;
    _requiredScales = [];
    _layerScale = void 0;
    me = function() {};
    me.owner = function(owner) {
      if (arguments.length === 0) {
        return _owner;
      } else {
        _owner = owner;
        return me;
      }
    };
    me.add = function(scale) {
      if (_list[scale.id()]) {
        $log.error("scaleList.add: scale " + (scale.id()) + " already defined in scaleList of " + (_owner.id()) + ". Duplicate scales are not allowed");
      }
      _list[scale.id()] = scale;
      _kindList[scale.kind()] = scale;
      return me;
    };
    me.hasScale = function(scale) {
      var s;
      s = me.getKind(scale.kind());
      return s.id() === scale.id();
    };
    me.getKind = function(kind) {
      if (_kindList[kind]) {
        return _kindList[kind];
      } else if (_parentList.getKind) {
        return _parentList.getKind(kind);
      } else {
        return void 0;
      }
    };
    me.hasKind = function(kind) {
      return !!me.getKind(kind);
    };
    me.remove = function(scale) {
      if (!_list[scale.id()]) {
        $log.warn("scaleList.delete: scale " + (scale.id()) + " not defined in scaleList of " + (_owner.id()) + ". Ignoring");
        return me;
      }
      delete _list[scale.id()];
      delete me[scale.id];
      return me;
    };
    me.parentScales = function(scaleList) {
      if (arguments.length === 0) {
        return _parentList;
      } else {
        _parentList = scaleList;
        return me;
      }
    };
    me.getOwned = function() {
      return _list;
    };
    me.allKinds = function() {
      var k, ret, s, _ref;
      ret = {};
      if (_parentList.allKinds) {
        _ref = _parentList.allKinds();
        for (k in _ref) {
          s = _ref[k];
          ret[k] = s;
        }
      }
      for (k in _kindList) {
        s = _kindList[k];
        ret[k] = s;
      }
      return ret;
    };
    me.requiredScales = function(req) {
      var k, _i, _len;
      if (arguments.length === 0) {
        return _requiredScales;
      } else {
        _requiredScales = req;
        for (_i = 0, _len = req.length; _i < _len; _i++) {
          k = req[_i];
          if (!me.hasKind(k)) {
            throw "Fatal Error: scale '" + k + "' required but not defined";
          }
        }
      }
      return me;
    };
    me.getScales = function(kindList) {
      var kind, l, _i, _len;
      l = {};
      for (_i = 0, _len = kindList.length; _i < _len; _i++) {
        kind = kindList[_i];
        if (me.hasKind(kind)) {
          l[kind] = me.getKind(kind);
        } else {
          throw "Fatal Error: scale '" + kind + "' required but not defined";
        }
      }
      return l;
    };
    me.getScaleProperties = function() {
      var k, l, prop, s, _ref;
      l = [];
      _ref = me.allKinds();
      for (k in _ref) {
        s = _ref[k];
        prop = s.property();
        if (prop) {
          if (Array.isArray(prop)) {
            l.concat(prop);
          } else {
            l.push(prop);
          }
        }
      }
      return l;
    };
    me.layerScale = function(kind) {
      if (arguments.length === 0) {
        if (_layerScale) {
          return me.getKind(_layerScale);
        }
        return void 0;
      } else {
        _layerScale = kind;
        return me;
      }
    };
    return me;
  };
});


/**
  @ngdoc provider
  @module wk.chart
  @name wkChartLocaleProvider
  @description
  registers a den locale
 */
angular.module('wk.chart').provider('wkChartLocale', function() {
  var locale, locales;
  locale = 'en_US';
  locales = {
    de_DE: d3.locale({
      decimal: ",",
      thousands: ".",
      grouping: [3],
      currency: ["", " €"],
      dateTime: "%A, der %e. %B %Y, %X",
      date: "%e.%m.%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
      shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    }),
    'en_US': d3.locale({
      "decimal": ".",
      "thousands": ",",
      "grouping": [3],
      "currency": ["$", ""],
      "dateTime": "%a %b %e %X %Y",
      "date": "%m/%d/%Y",
      "time": "%H:%M:%S",
      "periods": ["AM", "PM"],
      "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    })
  };

  /**
    @ngdoc method
    @name wkChartLocaleProvider#setLocale
    @param name {string} name of the locale. If locale is unknown it reports an error and sets locale to en_US
   */
  this.setLocale = function(l) {
    if (_.has(locales, l)) {
      return locale = l;
    } else {
      throw "unknowm locale '" + l + "' using 'en-US' instead";
    }
  };

  /**
    @ngdoc method
    @name wkChartLocaleProvider#addLocaleDefinition
    @param name {string} name of the locale.
    @param localeDefinition {object} A d3.js locale definition object. See [d3 documentation](https://github.com/mbostock/d3/wiki/Localization#d3_locale) for details of the format.
   */
  this.addLocaleDefinition = function(name, l) {
    return locales[name] = d3.locale(l);
  };

  /**
    @ngdoc service
    @module wk.chart
    @name wkChartLocale
    @description
    @returns d3.ls locale definition
   */
  this.$get = [
    '$log', function($log) {
      return locales[locale];
    }
  ];
  return this;
});

angular.module('wk.chart').provider('wkChartScales', function() {
  var categoryColors, categoryColorsHashed, customScale, hashed, _customColors, _customMapFn;
  _customColors = ['red', 'orange', 'yellow', 'green', 'blue'];
  _customMapFn = void 0;
  hashed = function() {
    var d3Scale, me, _hashFn;
    d3Scale = d3.scale.ordinal();
    _hashFn = function(value) {
      var hash, i, m, _i, _ref, _results;
      hash = 0;
      m = d3Scale.range().length - 1;
      _results = [];
      for (i = _i = 0, _ref = value.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(hash = (31 * hash + value.charAt(i)) % m);
      }
      return _results;
    };
    me = function(value) {
      if (!arguments) {
        return me;
      }
      return d3Scale(_hashFn(value));
    };
    me.range = function(range) {
      if (!arguments) {
        return d3Scale.range();
      }
      d3Scale.domain(d3.range(range.length));
      return d3Scale.range(range);
    };
    me.domain = d3Scale.domain;
    me.rangePoint = d3Scale.rangePoints;
    me.rangeBands = d3Scale.rangeBands;
    me.rangeRoundBands = d3Scale.rangeRoundBands;
    me.rangeBand = d3Scale.rangeBand;
    me.rangeExtent = d3Scale.rangeExtent;
    me.hash = function(fn) {
      if (!arguments) {
        return _hashFn;
      }
      _hashFn = fn;
      return me;
    };
    return me;
  };
  customScale = function() {
    var d3Scale, mapFn, me;
    d3Scale = d3.scale.ordinal();
    mapFn = _customMapFn || d3Scale;
    me = function(value) {
      if (!arguments) {
        return me;
      }
      return mapFn.apply(me, [value]);
    };
    me.mapFn = function(fn) {
      if (!arguments) {
        return mapFn;
      }
      if (_.isFunction(fn)) {
        mapFn = fn;
      }
      return me;
    };
    me.domain = d3Scale.domain;
    me.range = d3Scale.range;
    me.rangePoint = d3Scale.rangePoints;
    me.rangeBands = d3Scale.rangeBands;
    me.rangeRoundBands = d3Scale.rangeRoundBands;
    me.rangeBand = d3Scale.rangeBand;
    me.rangeExtent = d3Scale.rangeExtent;
    return me;
  };
  categoryColors = function() {
    return d3.scale.ordinal().range(_customColors);
  };
  categoryColorsHashed = function() {
    return hashed().range(_customColors);
  };
  this.colors = function(colors) {
    return _customColors = colors;
  };
  this.customMapFn = function(fn) {
    var mapFn;
    if (_.isFunction(fn)) {
      return mapFn = fn;
    }
  };
  this.$get = [
    '$log', function($log) {
      return {
        hashed: hashed,
        customCategory: categoryColors,
        customCategoryHashed: categoryColorsHashed,
        customScale: customScale
      };
    }
  ];
  return this;
});


/**
  @ngdoc provider
  @module wk.chart
  @name wkChartTemplatesProvider
  @description
  used to register a custom tooltip or legend default template and overwrite the default system templates.
 */
angular.module('wk.chart').provider('wkChartTemplates', function() {
  var legendTemplateUrl, tooltipTemplateUrl;
  tooltipTemplateUrl = 'templates/toolTip.html';
  legendTemplateUrl = 'templates/legend.html';

  /**
    @ngdoc method
    @name wkChartTemplatesProvider#setTooltipTemplate
    @param url {string} the url of the template file
   */
  this.setTooltipTemplate = function(url) {
    return tooltipTemplateUrl = url;
  };

  /**
      @ngdoc method
      @name wkChartTemplatesProvider#setLegendTemplate
      @param url {string} the url of the template file
   */
  this.setLegendTemplate = function(url) {
    return legendTemplateUrl = url;
  };

  /**
    @ngdoc service
    @module wk.chart
    @name wkChartTemplates
    @description
    provides the default tooltip and legend template.
   */
  this.$get = [
    '$log', '$templateCache', function($log, $templateCache) {
      return {

        /**
          @ngdoc method
          @name wkChartTemplates#tooltipTemplate
          @returns {string} the tooltips template
         */
        tooltipTemplate: function() {
          return $templateCache.get(tooltipTemplateUrl);
        },

        /**
          @ngdoc method
          @name wkChartTemplates#legendTemplate
          @returns {string} the legends template
         */
        legendTemplate: function() {
          return $templateCache.get(legendTemplateUrl);
        }
      };
    }
  ];
  return this;
});

angular.module('wk.chart').service('selectionSharing', function($log) {
  var callbacks, _selection, _selectionIdxRange;
  _selection = {};
  _selectionIdxRange = {};
  callbacks = {};
  this.createGroup = function(group) {};
  this.setSelection = function(selection, selectionIdxRange, group) {
    var cb, _i, _len, _ref, _results;
    if (group) {
      _selection[group] = selection;
      _selectionIdxRange[group] = selectionIdxRange;
      if (callbacks[group]) {
        _ref = callbacks[group];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cb = _ref[_i];
          _results.push(cb(selection, selectionIdxRange));
        }
        return _results;
      }
    }
  };
  this.getSelection = function(group) {
    var grp;
    grp = group || 'default';
    return selection[grp];
  };
  this.register = function(group, callback) {
    if (group) {
      if (!callbacks[group]) {
        callbacks[group] = [];
      }
      if (!_.contains(callbacks[group], callback)) {
        return callbacks[group].push(callback);
      }
    }
  };
  this.unregister = function(group, callback) {
    var idx;
    if (callbacks[group]) {
      idx = callbacks[group].indexOf(callback);
      if (idx >= 0) {
        return callbacks[group].splice(idx, 1);
      }
    }
  };
  return this;
});

angular.module('wk.chart').service('timing', function($log) {
  var elapsed, elapsedStart, timers;
  timers = {};
  elapsedStart = 0;
  elapsed = 0;
  this.init = function() {
    return elapsedStart = Date.now();
  };
  this.start = function(topic) {
    var top;
    top = timers[topic];
    if (!top) {
      top = timers[topic] = {
        name: topic,
        start: 0,
        total: 0,
        callCnt: 0,
        active: false
      };
    }
    top.start = Date.now();
    return top.active = true;
  };
  this.stop = function(topic) {
    var top;
    if (top = timers[topic]) {
      top.active = false;
      top.total += Date.now() - top.start;
      top.callCnt += 1;
    }
    return elapsed = Date.now() - elapsedStart;
  };
  this.report = function() {
    var topic, val;
    for (topic in timers) {
      val = timers[topic];
      val.avg = val.total / val.callCnt;
    }
    $log.info(timers);
    $log.info('Elapsed Time (ms)', elapsed);
    return timers;
  };
  this.clear = function() {
    return timers = {};
  };
  return this;
});

angular.module('wk.chart').factory('dataLabelFactory', function($log, wkChartMargins) {
  var dataLabels, labelCnt;
  labelCnt = 0;
  return dataLabels = function() {
    var me, _active, _anchor, _duration, _keyAxis, _keyScale, _labelSelection, _margin, _style, _valueAxis, _valueScale;
    _labelSelection = void 0;
    _active = false;
    _keyScale = void 0;
    _valueScale = void 0;
    _keyAxis = void 0;
    _valueAxis = void 0;
    _anchor = void 0;
    _margin = void 0;
    _duration = void 0;
    _style = {
      'font-size': '1.3em'
    };
    me = function(s, doAnimate, style) {
      var barSize, text;
      _labelSelection = s;
      barSize = _keyScale.scale().rangeBand();
      text = s.select('text');
      if (text.empty()) {
        text = s.append('text').attr('class', 'wk-chart-data-label').attr(_anchor).style('opacity', 0).attr(_keyAxis, function(d) {
          if (d.added || d.deleted) {
            return 0;
          } else {
            return barSize / 2;
          }
        }).attr(_valueAxis, function(d) {
          return _margin + (_valueAxis === 'x' ? Math.abs(_valueScale.scale()(0) - _valueScale.scale()(d.targetValue)) : Math.min(_valueScale.scale()(0), _valueScale.scale()(d.targetValue)));
        });
      }
      text.text(function(d) {
        return _valueScale.formatValue(d.targetValue);
      }).style(style);
      return (doAnimate ? text.transition().duration(_duration) : text).attr(_keyAxis, function(d) {
        if (d.added || d.deleted) {
          return 0;
        } else {
          return barSize / 2;
        }
      }).attr(_valueAxis, function(d) {
        return _margin + (_valueAxis === 'x' ? Math.abs(_valueScale.scale()(0) - _valueScale.scale()(d.targetValue)) : Math.min(_valueScale.scale()(0), _valueScale.scale()(d.targetValue)));
      }).style('opacity', function(d) {
        if (d.added || d.deleted || !_active) {
          return 0;
        } else {
          return 1;
        }
      });
    };
    me.brush = function(s) {
      return s.select('text').attr(_keyAxis, _keyScale.scale().rangeBand() / 2);
    };
    me.active = function(val) {
      if (arguments.length === 0) {
        return _active;
      }
      _active = val;
      return me;
    };
    me.keyScale = function(val) {
      if (arguments.length === 0) {
        return _keyScale;
      }
      _keyScale = val;
      if (_keyScale.isHorizontal()) {
        _keyAxis = 'x';
        _valueAxis = 'y';
        _anchor = {
          'text-anchor': 'middle'
        };
        _margin = -wkChartMargins.dataLabelPadding.vert;
      } else {
        _keyAxis = 'y';
        _valueAxis = 'x';
        _anchor = {
          'text-anchor': 'start',
          'dy': '0.35em'
        };
        _margin = wkChartMargins.dataLabelPadding.hor;
      }
      return me;
    };
    me.valueScale = function(val) {
      if (arguments.length === 0) {
        return _valueScale;
      }
      _valueScale = val;
      return me;
    };
    me.duration = function(val) {
      if (arguments.length === 0) {
        return _duration;
      }
      _duration = val;
      return me;
    };
    me.style = function(val) {
      if (arguments.length === 0) {
        return _style;
      }
      _style = val;
      return me;
    };
    return me;
  };
});

angular.module('wk.chart').factory('layeredData', function($log) {
  var layered;
  return layered = function() {
    var me, _calcTotal, _data, _layerKeys, _max, _min, _tMax, _tMin, _x;
    _data = [];
    _layerKeys = [];
    _x = void 0;
    _calcTotal = false;
    _min = Infinity;
    _max = -Infinity;
    _tMin = Infinity;
    _tMax = -Infinity;
    me = function() {};
    me.data = function(dat) {
      if (arguments.length(Is(0))) {
        return _data;
      } else {
        _data = dat;
        return me;
      }
    };
    me.layerKeys = function(keys) {
      if (arguments.length === 0) {
        return _layerKeys;
      } else {
        _layerKeys = keys;
        return me;
      }
    };
    me.x = function(name) {
      if (arguments.length === 0) {
        return _x;
      } else {
        _x = name;
        return me;
      }
    };
    me.calcTotal = function(t_f) {
      if (arguments.length === 0) {
        return _calcTotal;
      } else {
        _calcTotal = t_f;
        return me;
      }
    };
    me.min = function() {
      return _min;
    };
    me.max = function() {
      return _max;
    };
    me.minTotal = function() {
      return _tMin;
    };
    me.maxTotal = function() {
      return _tMax;
    };
    me.extent = function() {
      return [me.min(), me.max()];
    };
    me.totalExtent = function() {
      return [me.minTotal(), me.maxTotal()];
    };
    me.columns = function(data) {
      var d, i, k, l, res, t, v, xv, _i, _j, _k, _len, _len1, _len2;
      if (arguments.length === 1) {
        res = [];
        _min = Infinity;
        _max = -Infinity;
        _tMin = Infinity;
        _tMax = -Infinity;
        for (i = _i = 0, _len = _layerKeys.length; _i < _len; i = ++_i) {
          k = _layerKeys[i];
          res[i] = {
            key: k,
            value: [],
            min: Infinity,
            max: -Infinity
          };
        }
        for (i = _j = 0, _len1 = data.length; _j < _len1; i = ++_j) {
          d = data[i];
          t = 0;
          xv = typeof _x === 'string' ? d[_x] : _x(d);
          for (_k = 0, _len2 = res.length; _k < _len2; _k++) {
            l = res[_k];
            v = +d[l.key];
            l.value.push({
              x: xv,
              value: v,
              key: l.key
            });
            if (l.max < v) {
              l.max = v;
            }
            if (l.min > v) {
              l.min = v;
            }
            if (_max < v) {
              _max = v;
            }
            if (_min > v) {
              _min = v;
            }
            if (_calcTotal) {
              t += +v;
            }
          }
          if (_calcTotal) {
            if (_tMax < t) {
              _tMax = t;
            }
            if (_tMin > t) {
              _tMin = t;
            }
          }
        }
        return {
          min: _min,
          max: _max,
          totalMin: _tMin,
          totalMax: _tMax,
          data: res
        };
      }
      return me;
    };
    me.rows = function(data) {
      if (arguments.length === 1) {
        return data.map(function(d) {
          return {
            x: d[_x],
            layers: layerKeys.map(function(k) {
              return {
                key: k,
                value: d[k],
                x: d[_x]
              };
            })
          };
        });
      }
      return me;
    };
    return me;
  };
});

angular.module('wk.chart').factory('markerFactory', function($log, d3Animation) {
  var markers, markersCnt;
  markersCnt = 0;
  return markers = function() {
    var me, _active, _color, _duration, _id, _initialOpacity, _isVertical, _markerSelection, _opacity, _x, _y;
    _x = void 0;
    _y = void 0;
    _color = void 0;
    _active = false;
    _opacity = 0;
    _initialOpacity = 0;
    _duration = d3Animation.duration;
    _isVertical = false;
    _markerSelection = void 0;
    _id = markersCnt++;
    me = function(s, doAnimate) {
      var m, mExit, mUpdate;
      _markerSelection = s;
      if (_active) {
        m = s.selectAll(".wk-chart-marker-" + _id).data(function(d) {
          return d.values;
        }, function(d, i) {
          return i;
        });
        m.enter().append('circle').attr('class', "wk-chart-marker-" + _id).style('fill', _color).attr('r', 5).style('pointer-events', 'none').style('opacity', _initialOpacity);
        mUpdate = doAnimate ? m.transition().duration(_duration) : m;
        mUpdate.attr('cx', _x).attr('cy', _y).style('opacity', function(d) {
          return (d.added || d.deleted || d.layerAdded || d.layerDeleted ? 0 : 1) * _opacity;
        });
        mExit = doAnimate ? m.exit().transition().duration(_duration) : m.exit();
        return mExit.remove();
      } else {
        return s.selectAll(".wk-chart-marker-" + _id).transition().duration(_duration).style('opacity', 0).remove();
      }
    };
    me.brush = function(selection, idxRange) {
      var c, v;
      if (_isVertical) {
        c = 'cy';
        v = _y;
      } else {
        c = 'cx';
        v = _x;
      }
      if (idxRange) {
        return _markerSelection.selectAll(".wk-chart-marker-" + _id).each(function(d, i) {
          if (idxRange[0] <= i && i <= idxRange[1]) {
            return d3.select(this).attr(c, v).style('opacity', 1);
          } else {
            return d3.select(this).style('opacity', 0);
          }
        });
      } else {
        return _markerSelection.selectAll(".wk-chart-marker-" + _id).attr(c, v);
      }
    };
    me.active = function(trueFalse) {
      if (arguments.length === 0) {
        return _active;
      }
      _initialOpacity = !_active && trueFalse ? 0 : 1;
      _active = trueFalse;
      _opacity = _active ? 1 : 0;
      return me;
    };
    me.x = function(val) {
      if (arguments.length === 0) {
        return _x;
      }
      _x = val;
      return me;
    };
    me.y = function(val) {
      if (arguments.length === 0) {
        return _y;
      }
      _y = val;
      return me;
    };
    me.color = function(val) {
      if (arguments.length === 0) {
        return _color;
      }
      _color = val;
      return me;
    };
    me.opacity = function(val) {
      if (arguments.length === 0) {
        return _opacity;
      }
      _opacity = val;
      return me;
    };
    me.duration = function(val) {
      if (arguments.length === 0) {
        return _duration;
      }
      _duration = val;
      return me;
    };
    me.isVertical = function(val) {
      if (arguments.length === 0) {
        return _isVertical;
      }
      _isVertical = val;
      return me;
    };
    return me;
  };
});

angular.module('wk.chart').directive('svgIcon', function($log) {
  return {
    restrict: 'E',
    template: '<svg ng-style="style"><path></path></svg>',
    scope: {
      path: "=",
      width: "@"
    },
    link: function(scope, elem, attrs) {
      scope.style = {
        height: '20px',
        width: scope.width + 'px',
        'vertical-align': 'middle'
      };
      return scope.$watch('path', function(val) {
        if (val) {
          return d3.select(elem[0]).select('path').attr('d', val).attr('transform', "translate(8,8)");
        }
      });
    }
  };
});

angular.module('wk.chart').factory('tooltipHelperFactory', function($log) {
  var helperCnt, ttHelpers;
  helperCnt = 0;
  ttHelpers = function() {
    var me, _brushRange, _circles, _colorByKey, _colorScale, _id, _indexer, _isStacked, _keyScale, _layout, _value, _valueScale;
    _keyScale = void 0;
    _valueScale = void 0;
    _isStacked = false;
    _colorScale = void 0;
    _colorByKey = false;
    _layout = void 0;
    _value = void 0;
    _indexer = void 0;
    _brushRange = [];
    _circles = void 0;
    _id = helperCnt++;
    me = {};
    me.keyScale = function(val) {
      if (arguments.length === 0) {
        return _keyScale;
      }
      _keyScale = val;
      return me;
    };
    me.valueScale = function(val) {
      var _isRangeScale;
      if (arguments.length === 0) {
        return _valueScale;
      }
      _valueScale = val;
      _isRangeScale = _valueScale.kind() === 'rangeX' || _valueScale.kind() === 'rangeY';
      return me;
    };
    me.isStacked = function(val) {
      if (arguments.length === 0) {
        return _isStacked;
      }
      _isStacked = val;
      return me;
    };
    me.colorScale = function(val) {
      if (arguments.length === 0) {
        return _colorScale;
      }
      _colorScale = val;
      return me;
    };
    me.colorByKey = function(val) {
      if (arguments.length === 0) {
        return _colorByKey;
      }
      _colorByKey = val;
      return me;
    };
    me.layout = function(val) {
      var d, i, _i, _len, _ref;
      if (arguments.length === 0) {
        return _layout;
      }
      _layout = val;
      _indexer = [];
      _brushRange = [0, _layout[0].values.length - 1];
      _ref = _layout[0].values;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        d = _ref[i];
        if (!d.deleted) {
          _indexer.push(i);
        }
      }
      return me;
    };
    me.brushRange = function(val) {
      if (arguments.length === 0) {
        return _brushRange;
      }
      return _brushRange = val;
    };
    me.value = function(val) {
      if (arguments.length === 0) {
        return _value;
      }
      _value = val;
      return me;
    };
    me.enter = function(data) {
      var layerKeys;
      this.headerName = _keyScale.axisLabel();
      this.headerValue = _keyScale.formattedValue(data);
      layerKeys = _valueScale.layerKeys(data);
      if (_colorScale.property()) {
        return this.layers = this.layers.concat(layerKeys.map(function(key) {
          return {
            name: key,
            value: _valueScale.formatValue(data[key]),
            color: {
              'background-color': _colorScale.map(data)
            }
          };
        }));
      } else if (_colorByKey) {
        return this.layers = this.layers.concat(layerKeys.map(function(key) {
          return {
            name: key,
            value: _valueScale.formatValue(data[key]),
            color: {
              'background-color': _colorScale.scale()(_keyScale.value(data))
            }
          };
        }));
      } else {
        return this.layers = this.layers.concat(layerKeys.map(function(key) {
          return {
            name: key,
            value: _valueScale.formatValue(data[key]),
            color: {
              'background-color': _colorScale.scale()(key)
            }
          };
        }));
      }
    };
    me.moveData = function(key, data) {
      return me.enter.apply(this, [data]);
    };
    me.moveMarkers = function(key, data) {
      var c, cData, enter, l, layerKeys, markerKey, offset, sum, _i, _len;
      markerKey = _keyScale.value(data);
      layerKeys = _valueScale.layerKeys(data);
      cData = layerKeys.map(function(key) {
        return {
          key: key,
          value: _valueScale.layerValue(data, key)
        };
      });
      if (_isStacked) {
        sum = 0;
        for (_i = 0, _len = cData.length; _i < _len; _i++) {
          l = cData[_i];
          sum = sum + l.value;
          l.value = sum;
        }
      }
      _circles = this.selectAll(".wk-chart-tt-marker-" + _id).data(cData, function(d) {
        return d.key;
      });
      enter = _circles.enter().append('g').attr('class', "wk-chart-tt-marker-" + _id);
      enter.append('circle').attr('class', 'wk-chart-tt-marker').attr('r', 9).style('fill', function(d) {
        return _colorScale.scale()(d.key);
      }).style('fill-opacity', 0.3).style('stroke', function(d) {
        return _colorScale.scale()(d.key);
      }).style('pointer-events', 'none');
      enter.append('circle').attr('class', 'wk-chart-tt-inner-marker').attr('r', 4).style('fill', function(d) {
        return _colorScale.scale()(d.key);
      }).style('fill-opacity', 0.6).style('stroke', 'white').style('pointer-events', 'none');
      c = _keyScale.isHorizontal() ? 'cy' : 'cx';
      _circles.select('.wk-chart-tt-marker').attr(c, function(d) {
        return _valueScale.scale()(d.value);
      });
      _circles.select('.wk-chart-tt-inner-marker').attr(c, function(d) {
        return _valueScale.scale()(d.value);
      });
      _circles.exit().remove();
      offset = _keyScale.isOrdinal() ? _keyScale.scale().rangeBand() / 2 : 0;
      if (_keyScale.isHorizontal()) {
        return this.attr('transform', "translate(" + (_keyScale.scale()(markerKey) + offset) + ")");
      } else {
        return this.attr('transform', "translate(0," + (_keyScale.scale()(markerKey) + offset) + ")");
      }
    };
    return me;
  };
  return ttHelpers;
});

angular.module('wk.chart').service('utils', function($log) {
  var id;
  this.diff = function(a, b, direction) {
    var i, j, notInB, res;
    notInB = function(v) {
      return b.indexOf(v) < 0;
    };
    res = {};
    i = 0;
    while (i < a.length) {
      if (notInB(a[i])) {
        res[a[i]] = void 0;
        j = i + direction;
        while ((0 <= j && j < a.length)) {
          if (notInB(a[j])) {
            j += direction;
          } else {
            res[a[i]] = a[j];
            break;
          }
        }
      }
      i++;
    }
    return res;
  };
  id = 0;
  this.getId = function() {
    return 'Chart' + id++;
  };
  this.parseList = function(val) {
    var l;
    if (val) {
      l = val.trim().replace(/^\[|\]$/g, '').split(',').map(function(d) {
        return d.replace(/^[\"|']|[\"|']$/g, '');
      });
      if (l.length === 1) {
        return l[0];
      } else {
        return l;
      }
    }
    return void 0;
  };
  this.parseTrueFalse = function(val) {
    if (val === '' || val === 'true') {
      return true;
    } else {
      if (val === 'false') {
        return false;
      } else {
        return void 0;
      }
    }
  };
  this.mergeData = function() {
    var me, _common, _data, _first, _hash, _key, _last, _layerKey, _prevCommon, _prevData, _prevHash;
    _prevData = [];
    _data = [];
    _prevHash = {};
    _hash = {};
    _prevCommon = [];
    _common = [];
    _first = void 0;
    _last = void 0;
    _key = function(d) {
      return d;
    };
    _layerKey = function(d) {
      return d;
    };
    me = function(data) {
      var d, i, j, key, _i, _j, _len, _len1;
      _prevData = [];
      _prevHash = {};
      for (i = _i = 0, _len = _data.length; _i < _len; i = ++_i) {
        d = _data[i];
        _prevData[i] = d;
        _prevHash[_key(d)] = i;
      }
      _prevCommon = [];
      _common = [];
      _hash = {};
      _data = data;
      for (j = _j = 0, _len1 = _data.length; _j < _len1; j = ++_j) {
        d = _data[j];
        key = _key(d);
        _hash[key] = j;
        if (_prevHash.hasOwnProperty(key)) {
          _prevCommon[_prevHash[key]] = true;
          _common[j] = true;
        }
      }
      return me;
    };
    me.key = function(fn) {
      if (!arguments) {
        return _key;
      }
      _key = fn;
      return me;
    };
    me.first = function(first) {
      if (!arguments) {
        return _first;
      }
      _first = first;
      return me;
    };
    me.last = function(last) {
      if (!arguments) {
        return _last;
      }
      _last = last;
      return me;
    };
    me.added = function() {
      var d, i, ret, _i, _len;
      ret = [];
      for (i = _i = 0, _len = _data.length; _i < _len; i = ++_i) {
        d = _data[i];
        if (!_common[i]) {
          ret.push(_d);
        }
      }
      return ret;
    };
    me.deleted = function() {
      var i, p, ret, _i, _len;
      ret = [];
      for (i = _i = 0, _len = _prevData.length; _i < _len; i = ++_i) {
        p = _prevData[i];
        if (!_prevCommon[i]) {
          ret.push(_prevData[i]);
        }
      }
      return ret;
    };
    me.current = function(key) {
      return _data[_hash[key]];
    };
    me.prev = function(key) {
      return _prevData[_prevHash[key]];
    };
    me.addedPred = function(added) {
      var predIdx;
      predIdx = _hash[_key(added)];
      while (!_common[predIdx]) {
        if (predIdx-- < 0) {
          return _first;
        }
      }
      return _prevData[_prevHash[_key(_data[predIdx])]];
    };
    me.addedPred.left = function(added) {
      return me.addedPred(added).x;
    };
    me.addedPred.right = function(added) {
      var obj;
      obj = me.addedPred(added);
      if (_.has(obj, 'width')) {
        return obj.x + obj.width;
      } else {
        return obj.x;
      }
    };
    me.deletedSucc = function(deleted) {
      var succIdx;
      succIdx = _prevHash[_key(deleted)];
      while (!_prevCommon[succIdx]) {
        if (succIdx++ >= _prevData.length) {
          return _last;
        }
      }
      return _data[_hash[_key(_prevData[succIdx])]];
    };
    return me;
  };
  this.mergeSeriesSorted = function(aOld, aNew) {
    var iNew, iOld, lMax, lNewMax, lOldMax, result;
    iOld = 0;
    iNew = 0;
    lOldMax = aOld.length - 1;
    lNewMax = aNew.length - 1;
    lMax = Math.max(lOldMax, lNewMax);
    result = [];
    while (iOld <= lOldMax && iNew <= lNewMax) {
      if (+aOld[iOld] === +aNew[iNew]) {
        result.push([iOld, Math.min(iNew, lNewMax), aOld[iOld]]);
        iOld++;
        iNew++;
      } else if (+aOld[iOld] < +aNew[iNew]) {
        result.push([iOld, void 0, aOld[iOld]]);
        iOld++;
      } else {
        result.push([void 0, Math.min(iNew, lNewMax), aNew[iNew]]);
        iNew++;
      }
    }
    while (iOld <= lOldMax) {
      result.push([iOld, void 0, aOld[iOld]]);
      iOld++;
    }
    while (iNew <= lNewMax) {
      result.push([void 0, Math.min(iNew, lNewMax), aNew[iNew]]);
      iNew++;
    }
    return result;
  };
  this.mergeSeriesUnsorted = function(aOld, aNew) {
    var iNew, iOld, lMax, lNewMax, lOldMax, result;
    iOld = 0;
    iNew = 0;
    lOldMax = aOld.length - 1;
    lNewMax = aNew.length - 1;
    lMax = Math.max(lOldMax, lNewMax);
    result = [];
    while (iOld <= lOldMax && iNew <= lNewMax) {
      if (aOld[iOld] === aNew[iNew]) {
        result.push([iOld, Math.min(iNew, lNewMax), aOld[iOld]]);
        iOld++;
        iNew++;
      } else if (aNew.indexOf(aOld[iOld]) < 0) {
        result.push([iOld, void 0, aOld[iOld]]);
        iOld++;
      } else {
        result.push([void 0, Math.min(iNew, lNewMax), aNew[iNew]]);
        iNew++;
      }
    }
    while (iOld <= lOldMax) {
      result.push([iOld, void 0, aOld[iOld]]);
      iOld++;
    }
    while (iNew <= lNewMax) {
      result.push([void 0, Math.min(iNew, lNewMax), aNew[iNew]]);
      iNew++;
    }
    return result;
  };
  return this;
});

angular.module('wk.chart').directive('chartGenerator', function($log, chartFactory, modelTypes) {
  return {
    restrict: 'E',
    scope: {
      markup: '=',
      properties: '=',
      error: '&',
      warning: '&'
    },
    link: function(scope, iElement, iAttrs) {
      if (iAttrs.properties) {
        scope.properties = chartFactory.create();
      }
      return scope.$watch('properties', function(values) {
        if (chartFactory.verify()) {
          if (iAttrs.markup) {
            scope.markup = chartFactory.generateMarkup(scope.properties);
          }
          if (iAttrs.warning && chartFactory.hasWarnings) {
            return scope.warning({
              warnings: chartFactory.warnings
            });
          }
        } else {
          if (iAttrs.error) {
            return scope.error({
              errors: chartFactory.errors
            });
          }
        }
      }, true);
    }
  };
});

angular.module('wk.chart').service('modelUtils', function($log, $templateCache, modelTypes) {
  var camelToDash;
  this.camelToDash = camelToDash = function(str) {
    return str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
  };
  this.dashToCamel = function(str) {
    return str.replace(/\W+(.)/g, function(x, chr) {
      return chr.toUpperCase();
    });
  };
  this.addProperty = function(obj, store, name) {
    return Object.defineProperty(obj, name, {
      get: function() {
        return store[name].value;
      },
      set: function(val) {
        return store[name].value = val;
      },
      enumerable: true
    });
  };
  this.addGetter = function(obj, store, name) {
    return Object.defineProperty(obj, name, {
      get: function() {
        return store[name];
      },
      enumerable: true
    });
  };
  this.addProperties = function(props, _data, me) {
    var dataType, name;
    for (name in props) {
      dataType = props[name];
      if (!_.has(me, name)) {
        _data[name] = {};
        this.addProperty(me, _data, name);
        if (_.isString(dataType)) {
          _data[name].validator = modelTypes.getValidator(dataType);
        } else {
          if (dataType.type === 'enum') {
            _data[name]["enum"] = dataType.values;
            _data[name].validator = modelTypes.getValidator(dataType);
          }
        }
      }
    }
    me.validate = function(name, value) {
      return _data[name].validator.apply(_data[name], [value]);
    };
    return me.acceptedValues = function(name) {
      return _data[name]["enum"];
    };
  };
  this.addDecorator = function(deco, _data, me) {
    _data[deco.name] = {};
    _data[deco.name + '$set'] = {};
    this.addProperty(me, _data, deco.name + '$set');
    if (_.has(deco, 'value')) {
      this.addProperty(me, _data, deco.name);
      if (_.isString(deco.value)) {
        _data[deco.name].validator = modelTypes.getValidator(deco.value);
      } else {

      }
      if (deco.value.type === 'enum') {
        _data[deco.name]["enum"] = deco.value.values;
        _data[deco.name].validator = modelTypes.getValidator(deco.value);
      }
    }
    return this.addProperties(deco.properties, _data, me);
  };
  this.addDecorators = function(decorators, _data, me) {
    var deco, _i, _len, _results;
    if (decorators) {
      _results = [];
      for (_i = 0, _len = decorators.length; _i < _len; _i++) {
        deco = decorators[_i];
        _results.push(this.addDecorator(deco, _data, me));
      }
      return _results;
    }
  };
  this.generateProperties = function(dProperties, iModel) {
    var markup, name, type;
    markup = '';
    for (name in dProperties) {
      type = dProperties[name];
      if (iModel[name]) {
        if (_.has(dProperties[name], 'generator')) {
          markup += dProperties[name].generator(iModel[name]);
        } else {
          markup += " " + (camelToDash(name)) + "=\"" + iModel[name] + "\"";
        }
      }
    }
    return markup;
  };
  this.generateDecorators = function(dDecorators, iModel) {
    var deco, markup, _i, _len;
    markup = '';
    if (dDecorators) {
      for (_i = 0, _len = dDecorators.length; _i < _len; _i++) {
        deco = dDecorators[_i];
        if (iModel[deco.name + '$set']) {
          if (_.has(deco, 'generator')) {
            markup += deco.generator(iModel[deco.name]);
          } else {
            if (iModel[deco.name]) {
              markup += " " + (camelToDash(deco.name)) + "=\"" + iModel[deco.name] + "\"";
            } else {
              markup += ' ' + camelToDash(deco.name);
            }
          }
          markup += this.generateProperties(deco.properties, iModel);
        }
      }
      return markup;
    }
    return '';
  };
  return this;
});

angular.module('wk.chart').service('chartFactory', function($log, modelTypes, dimensionFactory, layoutFactory, modelUtils) {
  var CreateObj;
  CreateObj = function(model) {
    return (function(model) {
      var me, _data;
      _data = {};
      _data.dimensions = {};
      _data.layouts = [];
      me = {};
      modelUtils.addProperties(model.properties, _data, me);
      modelUtils.addDecorators(model.decorators, _data, me);
      modelUtils.addGetter(me, _data, 'dimensions');
      modelUtils.addGetter(me, _data, 'layouts');
      me.availableDimensions = function() {
        return _.keys(modelTypes.dimension);
      };
      me.addDimension = function(name) {
        _data.dimensions[name] = dimensionFactory.create(name);
        return _data.dimensions[name];
      };
      me.removeDimension = function(name) {
        delete _data.dimensions[name];
        return void 0;
      };
      me.availableLayouts = function() {
        return _.keys(modelTypes.layouts);
      };
      me.addLayout = function(type) {
        var l;
        l = layoutFactory.create(type);
        _data.layouts.push(l);
        return l;
      };
      me.removeLayout = function(layout) {
        var idx;
        idx = _data.layouts.indexOf(layout);
        if (idx >= 0) {
          _data.layouts.splice(idx, 1);
        }
        return void 0;
      };
      me.getDescriptor = function() {
        return model;
      };
      return me;
    })(model);
  };
  this.create = function() {
    return CreateObj(modelTypes.chart);
  };
  this.verify = function() {
    return true;
  };
  this.generateMarkup = function(iModel) {
    var dModel, markup;
    dModel = iModel.getDescriptor();
    markup = "<" + dModel.name;
    markup += modelUtils.generateProperties(dModel.properties, iModel);
    markup += modelUtils.generateDecorators(dModel.decorators, iModel);
    markup += '>';
    markup += dimensionFactory.generateMarkup(iModel.dimensions);
    markup += layoutFactory.generateMarkup(iModel.layouts);
    markup += "\n</" + dModel.name + ">";
    return markup;
  };
  this.hasErrors = false;
  this.errors = [];
  this.hasWarnings = false;
  this.warnings = [];
  return this;
});

angular.module('wk.chart').service('dimensionFactory', function($log, modelUtils, modelTypes) {
  var CreateObj;
  CreateObj = function(model) {
    return (function(model) {
      var me, _data;
      _data = {};
      me = {};
      modelUtils.addProperties(model.properties, _data, me);
      modelUtils.addDecorators(model.decorators, _data, me);
      me.getDescriptor = function() {
        return model;
      };
      return me;
    })(model);
  };
  this.create = function(type) {
    if (_.has(modelTypes.dimension, type)) {
      return CreateObj(modelTypes.dimension[type]);
    }
  };
  this.generateMarkup = function(iDimensions) {
    var dModel, dim, markup, name;
    markup = '';
    for (name in iDimensions) {
      dim = iDimensions[name];
      dModel = dim.getDescriptor();
      markup += "\n\t\t<" + (modelUtils.camelToDash(dModel.name));
      markup += modelUtils.generateProperties(dModel.properties, dim);
      markup += modelUtils.generateDecorators(dModel.decorators, dim);
      markup += ' />';
    }
    return markup;
  };
  return this;
});

angular.module('wk.chart').service('layoutFactory', function($log, dimensionFactory, modelTypes, modelUtils) {
  var CreateObj;
  CreateObj = function(model) {
    return (function(model) {
      var dim, me, name, _data, _ref;
      _data = {};
      _data.dimensions = {};
      _data.layout = model.name;
      me = {};
      modelUtils.addProperties(model.properties, _data, me);
      modelUtils.addDecorators(model.decorators, _data, me);
      _ref = model.dimensions;
      for (name in _ref) {
        dim = _ref[name];
        _data.dimensions[name] = dimensionFactory.create(name);
      }
      modelUtils.addGetter(me, _data, 'dimensions');
      modelUtils.addGetter(me, _data, 'layout');
      me.addDimension = function(name) {
        _data.dimensions[name] = dimensionFactory.create(name);
        return _data.dimensions[name];
      };
      me.removeDimension = function(name) {
        delete _data.dimensions[name];
        return void 0;
      };
      me.getDescriptor = function() {
        return model;
      };
      return me;
    })(model);
  };
  this.create = function(type) {
    if (_.has(modelTypes.layouts, type)) {
      return CreateObj(modelTypes.layouts[type]);
    }
  };

  /*
  this.getTypes = () ->
    return _.keys(layouts)
  
  this.verifyType = (type) ->
    return _.has(layouts, type)
   */
  this.generateMarkup = function(layoutModel) {
    var dModel, layout, markup, _i, _len;
    markup = '';
    for (_i = 0, _len = layoutModel.length; _i < _len; _i++) {
      layout = layoutModel[_i];
      dModel = layout.getDescriptor();
      markup += "\n\t<layout";
      if (!layout[modelUtils.dashToCamel(dModel.name)]) {
        markup += " " + (modelUtils.camelToDash(dModel.name));
      }
      markup += modelUtils.generateProperties(dModel.properties, layout);
      markup += modelUtils.generateDecorators(dModel.decorators, layout);
      markup += '>';
      markup += dimensionFactory.generateMarkup(layout.dimensions);
      markup += "\n\t</layout>";
    }
    return markup;
  };
  return this;
});

'use strict';
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

angular.module('wk.chart').service('modelTypes', function($log, wkChartScales) {
  var areaStacked, areaStackedVertical, assign, axis, base, brush, brushed, dim, donat, geojson, getScaleTypes, labels, layout, legend, markers, outerPadding, padding, projection, property, propertyType, range, selection, spline, tickRotation, tooltips, valuesLegend;
  layout = function(name, dimensionList, value, layerDimension, properties, decorators) {
    var d, dims, ret, _i, _len;
    ret = {
      name: name,
      clazz: 'layout',
      value: value,
      layerDimension: layerDimension,
      properties: assign(properties),
      decorators: decorators,
      dimensions: {}
    };
    dims = dimensionList.trim().split(',');
    for (_i = 0, _len = dims.length; _i < _len; _i++) {
      d = dims[_i];
      ret.dimensions[d.trim()] = {};
    }
    return ret;
  };
  dim = function(name, properties, decorators) {
    return {
      clazz: 'dimension',
      name: name,
      properties: assign(properties),
      decorators: decorators
    };
  };
  getScaleTypes = function() {
    return _.keys(d3.scale).concat('time').concat(_.keys(wkChartScales));
  };
  assign = function(list) {
    return _.assign.apply(this, [{}].concat(list));
  };
  propertyType = {
    string: 'string',
    number: 'number',
    bool: 'boolean',
    list: 'list',
    "enum": function(list) {
      return {
        type: 'enum',
        values: list
      };
    },
    object: 'scope variable',
    event: 'scope event',
    callback: 'callback',
    objArray: 'scope variable'
  };
  this.getValidator = function(type) {
    switch (type) {
      case propertyType.string:
        return _.isString;
      case propertyType.number:
        return _.isNumber;
      case propertyType.bool:
        return _.isBoolean;
      case propertyType.list:
        return function(val) {
          return /^\[(.*)\]$|^[^\[](?=[^\]\[]*$)/.test(val);
        };
      default:
        if (_.isObject(type) && type.type === 'enum') {
          return function(val) {
            return __indexOf.call(this["enum"], val) >= 0;
          };
        } else {
          return function() {
            return true;
          };
        }
    }
  };
  markers = {
    markers: propertyType.bool
  };
  donat = {
    donat: propertyType.bool
  };
  padding = {
    padding: propertyType.number
  };
  outerPadding = {
    outerPadding: propertyType.number
  };
  areaStacked = {
    areaStacked: propertyType["enum"](['zero', 'silhouette', 'expand', 'wiggle'])
  };
  areaStackedVertical = {
    areaStackedVertical: propertyType["enum"](['zero', 'silhouette', 'expand', 'wiggle'])
  };
  geojson = {
    geojson: propertyType.object
  };
  projection = {
    projection: propertyType.object
  };
  spline = {
    spline: propertyType.bool
  };
  property = {
    property: propertyType.list
  };
  tickRotation = {
    rotateTickLabels: propertyType.number
  };
  range = {
    lowerProperty: propertyType.string,
    upperProperty: propertyType.string
  };
  base = {
    type: propertyType["enum"](getScaleTypes()),
    domain: propertyType.list,
    reset: propertyType.bool,
    range: propertyType.list,
    domainRange: propertyType["enum"](['min', 'max', 'extent', 'total']),
    label: propertyType.string,
    labelStyle: propertyType.object,
    exponent: propertyType.number,
    reverse: propertyType.bool
  };
  tooltips = {
    name: 'tooltips',
    clazz: 'decorator',
    key: 'tooltips$set',
    show: propertyType.bool,
    value: propertyType.bool,
    properties: {
      tooltipsTemplate: propertyType.string
    }
  };
  axis = {
    name: 'axis',
    clazz: 'decorator',
    key: 'axis$set',
    value: propertyType["enum"](['top', 'bottom', 'left', 'right']),
    properties: {
      grid: propertyType.bool,
      format: propertyType.string,
      showLabel: propertyType.bool,
      ticks: propertyType.number,
      tickFormat: propertyType.string,
      axisFormatter: propertyType.object
    }
  };
  legend = {
    name: 'legend',
    clazz: 'decorator',
    key: 'legend$set',
    value: propertyType["enum"](['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    properties: {
      templateUrl: propertyType.string
    }
  };
  valuesLegend = {
    name: 'valuesLegend',
    clazz: 'decorator',
    key: 'valuesLegend$set',
    value: propertyType["enum"](['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    properties: {
      templateUrl: propertyType.string
    }
  };
  selection = {
    name: 'selection',
    clazz: 'decorator',
    key: 'selection$set',
    properties: {
      selectedDomain: propertyType.object,
      clearSelection: propertyType.callback,
      selectedDomainChange: propertyType.event
    }
  };
  brush = {
    name: 'brush',
    key: 'brush$set',
    clazz: 'decorator',
    value: propertyType.string,
    properties: {
      selectedDomain: propertyType.object,
      selectedValues: propertyType.object,
      brushExtent: propertyType.object,
      selectedDomainChange: propertyType.event,
      brushStart: propertyType.event,
      brushEnd: propertyType.event,
      clearBrush: propertyType.callback
    }
  };
  brushed = {
    name: 'brushed',
    clazz: 'decorator',
    key: 'brushed$set',
    value: propertyType.string
  };
  labels = {
    name: 'labels',
    clazz: 'decorator',
    key: 'labels$set',
    properties: {
      labelStyle: propertyType.object
    }
  };
  this.chart = {
    name: 'chart',
    clazz: 'chart',
    properties: {
      data: propertyType.objArray,
      header: propertyType.string,
      headerStyle: propertyType.object,
      subHeader: propertyType.string,
      subHeaderStyle: propertyType.object,
      deepWatch: propertyType.bool,
      filter: propertyType.string,
      edit: propertyType.bool,
      editSelected: propertyType.event
    },
    decorators: [tooltips],
    dimensions: {},
    layouts: []
  };
  this.layouts = {
    line: layout('line', 'x,y,color', false, 'y', [markers, spline]),
    lineVertical: layout('lineVertical', 'x,y,color', false, 'x', [markers, spline]),
    area: layout('area', 'x,y,color', false, 'x', [markers, spline]),
    areaVertical: layout('areaVertical', 'x,y,color', false, 'y', [markers, spline]),
    areaStacked: layout('areaStacked', 'x,y,color', false, 'y', [areaStacked, markers, spline]),
    areaStackedVertical: layout('areaStackedVertical', 'x,y,color', false, 'x', [areaStackedVertical, markers, spline]),
    bars: layout('bars', 'x,y,color', false, false, [padding, outerPadding], [labels, selection]),
    barStacked: layout('barStacked', 'x,y,color', false, 'x', [padding, outerPadding], [selection]),
    barClustered: layout('barClustered', 'x,y,color', false, 'x', [padding, outerPadding], [selection]),
    column: layout('column', 'x,y,color', false, false, [padding, outerPadding], [labels, selection]),
    columnStacked: layout('columnStacked', 'x,y,color', false, 'y', [padding, outerPadding], [selection]),
    columnClustered: layout('columnClustered', 'x,y,color', false, 'y', [padding, outerPadding], [selection]),
    rangeArea: layout('rangeArea', 'x,y,color', false, false, [], [selection]),
    rangeAreaVertical: layout('rangeAreaVertical', 'x,y,color', false, false, [], [selection]),
    rangeBars: layout('rangeBars', 'x,y,color', false, false, [], [labels, selection]),
    rangeColumn: layout('rangeColumn', 'x,y,color', false, false, [], [labels, selection]),
    histogram: layout('histogram', 'x,y,color', false, false, [], [labels, selection]),
    pie: layout('pie', 'size,color', false, false, [donat], [labels, selection]),
    spider: layout('spider', 'x,y,color', false, false, [], [selection]),
    bubble: layout('bubble', 'x,y,color,size', false, false, [], [selection, brush]),
    scatter: layout('scatter', 'x,y,color,size,shape', false, false, [], [selection, brush]),
    geoMap: layout('geo-map', 'color', false, false, [geojson, projection], [selection])
  };
  this.dimension = {
    x: dim('x', [property, base, tickRotation], [axis, brush, brushed]),
    y: dim('y', [property, base], [axis, brush, brushed]),
    color: dim('color', [property, base], [legend, valuesLegend]),
    size: dim('size', [property, base], [legend, valuesLegend]),
    shape: dim('shape', [property, base], [legend, valuesLegend])
  };
  return this;
});

//# sourceMappingURL=maps/wk-charts.js.map