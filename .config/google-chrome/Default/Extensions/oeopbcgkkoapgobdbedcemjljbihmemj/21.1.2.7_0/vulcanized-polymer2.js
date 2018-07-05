// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

var WEB_ANIMATIONS_TESTING = false;
var webAnimationsTesting = null;
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

var webAnimationsShared = {};
var webAnimations1 = {};
var webAnimationsNext = {};

if (!WEB_ANIMATIONS_TESTING)
  var webAnimationsTesting = null;
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, testing) {

  var fills = 'backwards|forwards|both|none'.split('|');
  var directions = 'reverse|alternate|alternate-reverse'.split('|');
  var linear = function(x) { return x; };

  function cloneTimingInput(timingInput) {
    if (typeof timingInput == 'number') {
      return timingInput;
    }
    var clone = {};
    for (var m in timingInput) {
      clone[m] = timingInput[m];
    }
    return clone;
  }

  function AnimationEffectTiming() {
    this._delay = 0;
    this._endDelay = 0;
    this._fill = 'none';
    this._iterationStart = 0;
    this._iterations = 1;
    this._duration = 0;
    this._playbackRate = 1;
    this._direction = 'normal';
    this._easing = 'linear';
    this._easingFunction = linear;
  }

  function isInvalidTimingDeprecated() {
    return shared.isDeprecated('Invalid timing inputs', '2016-03-02', 'TypeError exceptions will be thrown instead.', true);
  }

  AnimationEffectTiming.prototype = {
    _setMember: function(member, value) {
      this['_' + member] = value;
      if (this._effect) {
        this._effect._timingInput[member] = value;
        this._effect._timing = shared.normalizeTimingInput(this._effect._timingInput);
        this._effect.activeDuration = shared.calculateActiveDuration(this._effect._timing);
        if (this._effect._animation) {
          this._effect._animation._rebuildUnderlyingAnimation();
        }
      }
    },
    get playbackRate() {
      return this._playbackRate;
    },
    set delay(value) {
      this._setMember('delay', value);
    },
    get delay() {
      return this._delay;
    },
    set endDelay(value) {
      this._setMember('endDelay', value);
    },
    get endDelay() {
      return this._endDelay;
    },
    set fill(value) {
      this._setMember('fill', value);
    },
    get fill() {
      return this._fill;
    },
    set iterationStart(value) {
      if ((isNaN(value) || value < 0) && isInvalidTimingDeprecated()) {
        throw new TypeError('iterationStart must be a non-negative number, received: ' + timing.iterationStart);
      }
      this._setMember('iterationStart', value);
    },
    get iterationStart() {
      return this._iterationStart;
    },
    set duration(value) {
      if (value != 'auto' && (isNaN(value) || value < 0) && isInvalidTimingDeprecated()) {
        throw new TypeError('duration must be non-negative or auto, received: ' + value);
      }
      this._setMember('duration', value);
    },
    get duration() {
      return this._duration;
    },
    set direction(value) {
      this._setMember('direction', value);
    },
    get direction() {
      return this._direction;
    },
    set easing(value) {
      this._easingFunction = parseEasingFunction(normalizeEasing(value));
      this._setMember('easing', value);
    },
    get easing() {
      return this._easing;
    },
    set iterations(value) {
      if ((isNaN(value) || value < 0) && isInvalidTimingDeprecated()) {
        throw new TypeError('iterations must be non-negative, received: ' + value);
      }
      this._setMember('iterations', value);
    },
    get iterations() {
      return this._iterations;
    }
  };

  function makeTiming(timingInput, forGroup, effect) {
    var timing = new AnimationEffectTiming();
    if (forGroup) {
      timing.fill = 'both';
      timing.duration = 'auto';
    }
    if (typeof timingInput == 'number' && !isNaN(timingInput)) {
      timing.duration = timingInput;
    } else if (timingInput !== undefined) {
      Object.getOwnPropertyNames(timingInput).forEach(function(property) {
        if (timingInput[property] != 'auto') {
          if (typeof timing[property] == 'number' || property == 'duration') {
            if (typeof timingInput[property] != 'number' || isNaN(timingInput[property])) {
              return;
            }
          }
          if ((property == 'fill') && (fills.indexOf(timingInput[property]) == -1)) {
            return;
          }
          if ((property == 'direction') && (directions.indexOf(timingInput[property]) == -1)) {
            return;
          }
          if (property == 'playbackRate' && timingInput[property] !== 1 && shared.isDeprecated('AnimationEffectTiming.playbackRate', '2014-11-28', 'Use Animation.playbackRate instead.')) {
            return;
          }
          timing[property] = timingInput[property];
        }
      });
    }
    return timing;
  }

  function numericTimingToObject(timingInput) {
    if (typeof timingInput == 'number') {
      if (isNaN(timingInput)) {
        timingInput = { duration: 0 };
      } else {
        timingInput = { duration: timingInput };
      }
    }
    return timingInput;
  }

  function normalizeTimingInput(timingInput, forGroup) {
    timingInput = shared.numericTimingToObject(timingInput);
    return makeTiming(timingInput, forGroup);
  }

  function cubic(a, b, c, d) {
    if (a < 0 || a > 1 || c < 0 || c > 1) {
      return linear;
    }
    return function(x) {
      if (x <= 0) {
        var start_gradient = 0;
        if (a > 0)
          start_gradient = b / a;
        else if (!b && c > 0)
          start_gradient = d / c;
        return start_gradient * x;
      }
      if (x >= 1) {
        var end_gradient = 0;
        if (c < 1)
          end_gradient = (d - 1) / (c - 1);
        else if (c == 1 && a < 1)
          end_gradient = (b - 1) / (a - 1);
        return 1 + end_gradient * (x - 1);
      }

      var start = 0, end = 1;
      while (start < end) {
        var mid = (start + end) / 2;
        function f(a, b, m) { return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m};
        var xEst = f(a, c, mid);
        if (Math.abs(x - xEst) < 0.00001) {
          return f(b, d, mid);
        }
        if (xEst < x) {
          start = mid;
        } else {
          end = mid;
        }
      }
      return f(b, d, mid);
    }
  }

  var Start = 1;
  var Middle = 0.5;
  var End = 0;

  function step(count, pos) {
    return function(x) {
      if (x >= 1) {
        return 1;
      }
      var stepSize = 1 / count;
      x += pos * stepSize;
      return x - x % stepSize;
    }
  }

  var presets = {
    'ease': cubic(0.25, 0.1, 0.25, 1),
    'ease-in': cubic(0.42, 0, 1, 1),
    'ease-out': cubic(0, 0, 0.58, 1),
    'ease-in-out': cubic(0.42, 0, 0.58, 1),
    'step-start': step(1, Start),
    'step-middle': step(1, Middle),
    'step-end': step(1, End)
  };

  var styleForCleaning = null;
  var numberString = '\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*';
  var cubicBezierRe = new RegExp('cubic-bezier\\(' + numberString + ',' + numberString + ',' + numberString + ',' + numberString + '\\)');
  var stepRe = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/;

  function normalizeEasing(easing) {
    if (!styleForCleaning) {
      styleForCleaning = document.createElement('div').style;
    }
    styleForCleaning.animationTimingFunction = '';
    styleForCleaning.animationTimingFunction = easing;
    var normalizedEasing = styleForCleaning.animationTimingFunction;
    if (normalizedEasing == '' && isInvalidTimingDeprecated()) {
      throw new TypeError(easing + ' is not a valid value for easing');
    }
    return normalizedEasing;
  }

  function parseEasingFunction(normalizedEasing) {
    if (normalizedEasing == 'linear') {
      return linear;
    }
    var cubicData = cubicBezierRe.exec(normalizedEasing);
    if (cubicData) {
      return cubic.apply(this, cubicData.slice(1).map(Number));
    }
    var stepData = stepRe.exec(normalizedEasing);
    if (stepData) {
      return step(Number(stepData[1]), {'start': Start, 'middle': Middle, 'end': End}[stepData[2]]);
    }
    var preset = presets[normalizedEasing];
    if (preset) {
      return preset;
    }
    // At this point none of our parse attempts succeeded; the easing is invalid.
    // Fall back to linear in the interest of not crashing the page.
    return linear;
  }

  function calculateActiveDuration(timing) {
    return Math.abs(repeatedDuration(timing) / timing.playbackRate);
  }

  function repeatedDuration(timing) {
    // https://w3c.github.io/web-animations/#calculating-the-active-duration
    if (timing.duration === 0 || timing.iterations === 0) {
      return 0;
    }
    return timing.duration * timing.iterations;
  }

  var PhaseNone = 0;
  var PhaseBefore = 1;
  var PhaseAfter = 2;
  var PhaseActive = 3;

  function calculatePhase(activeDuration, localTime, timing) {
    // https://w3c.github.io/web-animations/#animation-effect-phases-and-states
    if (localTime == null) {
      return PhaseNone;
    }

    var endTime = timing.delay + activeDuration + timing.endDelay;
    if (localTime < Math.min(timing.delay, endTime)) {
      return PhaseBefore;
    }
    if (localTime >= Math.min(timing.delay + activeDuration, endTime)) {
      return PhaseAfter;
    }

    return PhaseActive;
  }

  function calculateActiveTime(activeDuration, fillMode, localTime, phase, delay) {
    // https://w3c.github.io/web-animations/#calculating-the-active-time
    switch (phase) {
      case PhaseBefore:
        if (fillMode == 'backwards' || fillMode == 'both')
          return 0;
        return null;
      case PhaseActive:
        return localTime - delay;
      case PhaseAfter:
        if (fillMode == 'forwards' || fillMode == 'both')
          return activeDuration;
        return null;
      case PhaseNone:
        return null;
    }
  }

  function calculateOverallProgress(iterationDuration, phase, iterations, activeTime, iterationStart) {
    // https://w3c.github.io/web-animations/#calculating-the-overall-progress
    var overallProgress = iterationStart;
    if (iterationDuration === 0) {
      if (phase !== PhaseBefore) {
        overallProgress += iterations;
      }
    } else {
      overallProgress += activeTime / iterationDuration;
    }
    return overallProgress;
  }

  function calculateSimpleIterationProgress(overallProgress, iterationStart, phase, iterations, activeTime, iterationDuration) {
    // https://w3c.github.io/web-animations/#calculating-the-simple-iteration-progress

    var simpleIterationProgress = (overallProgress === Infinity) ? iterationStart % 1 : overallProgress % 1;
    if (simpleIterationProgress === 0 && phase === PhaseAfter && iterations !== 0 &&
        (activeTime !== 0 || iterationDuration === 0)) {
      simpleIterationProgress = 1;
    }
    return simpleIterationProgress;
  }

  function calculateCurrentIteration(phase, iterations, simpleIterationProgress, overallProgress) {
    // https://w3c.github.io/web-animations/#calculating-the-current-iteration
    if (phase === PhaseAfter && iterations === Infinity) {
      return Infinity;
    }
    if (simpleIterationProgress === 1) {
      return Math.floor(overallProgress) - 1;
    }
    return Math.floor(overallProgress);
  }

  function calculateDirectedProgress(playbackDirection, currentIteration, simpleIterationProgress) {
    // https://w3c.github.io/web-animations/#calculating-the-directed-progress
    var currentDirection = playbackDirection;
    if (playbackDirection !== 'normal' && playbackDirection !== 'reverse') {
      var d = currentIteration;
      if (playbackDirection === 'alternate-reverse') {
        d += 1;
      }
      currentDirection = 'normal';
      if (d !== Infinity && d % 2 !== 0) {
        currentDirection = 'reverse';
      }
    }
    if (currentDirection === 'normal') {
      return simpleIterationProgress;
    }
    return 1 - simpleIterationProgress;
  }

  function calculateIterationProgress(activeDuration, localTime, timing) {
    var phase = calculatePhase(activeDuration, localTime, timing);
    var activeTime = calculateActiveTime(activeDuration, timing.fill, localTime, phase, timing.delay);
    if (activeTime === null)
      return null;

    var overallProgress = calculateOverallProgress(timing.duration, phase, timing.iterations, activeTime, timing.iterationStart);
    var simpleIterationProgress = calculateSimpleIterationProgress(overallProgress, timing.iterationStart, phase, timing.iterations, activeTime, timing.duration);
    var currentIteration = calculateCurrentIteration(phase, timing.iterations, simpleIterationProgress, overallProgress);
    var directedProgress = calculateDirectedProgress(timing.direction, currentIteration, simpleIterationProgress);

    // https://w3c.github.io/web-animations/#calculating-the-transformed-progress
    // https://w3c.github.io/web-animations/#calculating-the-iteration-progress
    return timing._easingFunction(directedProgress);
  }

  shared.cloneTimingInput = cloneTimingInput;
  shared.makeTiming = makeTiming;
  shared.numericTimingToObject = numericTimingToObject;
  shared.normalizeTimingInput = normalizeTimingInput;
  shared.calculateActiveDuration = calculateActiveDuration;
  shared.calculateIterationProgress = calculateIterationProgress;
  shared.calculatePhase = calculatePhase;
  shared.normalizeEasing = normalizeEasing;
  shared.parseEasingFunction = parseEasingFunction;

  if (WEB_ANIMATIONS_TESTING) {
    testing.normalizeTimingInput = normalizeTimingInput;
    testing.normalizeEasing = normalizeEasing;
    testing.parseEasingFunction = parseEasingFunction;
    testing.calculateActiveDuration = calculateActiveDuration;
    testing.calculatePhase = calculatePhase;
    testing.PhaseNone = PhaseNone;
    testing.PhaseBefore = PhaseBefore;
    testing.PhaseActive = PhaseActive;
    testing.PhaseAfter = PhaseAfter;
  }

})(webAnimationsShared, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, testing) {
  var shorthandToLonghand = {
    background: [
      'backgroundImage',
      'backgroundPosition',
      'backgroundSize',
      'backgroundRepeat',
      'backgroundAttachment',
      'backgroundOrigin',
      'backgroundClip',
      'backgroundColor'
    ],
    border: [
      'borderTopColor',
      'borderTopStyle',
      'borderTopWidth',
      'borderRightColor',
      'borderRightStyle',
      'borderRightWidth',
      'borderBottomColor',
      'borderBottomStyle',
      'borderBottomWidth',
      'borderLeftColor',
      'borderLeftStyle',
      'borderLeftWidth'
    ],
    borderBottom: [
      'borderBottomWidth',
      'borderBottomStyle',
      'borderBottomColor'
    ],
    borderColor: [
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor'
    ],
    borderLeft: [
      'borderLeftWidth',
      'borderLeftStyle',
      'borderLeftColor'
    ],
    borderRadius: [
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
      'borderBottomLeftRadius'
    ],
    borderRight: [
      'borderRightWidth',
      'borderRightStyle',
      'borderRightColor'
    ],
    borderTop: [
      'borderTopWidth',
      'borderTopStyle',
      'borderTopColor'
    ],
    borderWidth: [
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth'
    ],
    flex: [
      'flexGrow',
      'flexShrink',
      'flexBasis'
    ],
    font: [
      'fontFamily',
      'fontSize',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'lineHeight'
    ],
    margin: [
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft'
    ],
    outline: [
      'outlineColor',
      'outlineStyle',
      'outlineWidth'
    ],
    padding: [
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft'
    ]
  };

  var shorthandExpanderElem = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');

  var borderWidthAliases = {
    thin: '1px',
    medium: '3px',
    thick: '5px'
  };

  var aliases = {
    borderBottomWidth: borderWidthAliases,
    borderLeftWidth: borderWidthAliases,
    borderRightWidth: borderWidthAliases,
    borderTopWidth: borderWidthAliases,
    fontSize: {
      'xx-small': '60%',
      'x-small': '75%',
      'small': '89%',
      'medium': '100%',
      'large': '120%',
      'x-large': '150%',
      'xx-large': '200%'
    },
    fontWeight: {
      normal: '400',
      bold: '700'
    },
    outlineWidth: borderWidthAliases,
    textShadow: {
      none: '0px 0px 0px transparent'
    },
    boxShadow: {
      none: '0px 0px 0px 0px transparent'
    }
  };

  function antiAlias(property, value) {
    if (property in aliases) {
      return aliases[property][value] || value;
    }
    return value;
  }

  function isNotAnimatable(property) {
    // https://w3c.github.io/web-animations/#concept-not-animatable
    return property === 'display' || property.lastIndexOf('animation', 0) === 0 || property.lastIndexOf('transition', 0) === 0;
  }

  // This delegates parsing shorthand value syntax to the browser.
  function expandShorthandAndAntiAlias(property, value, result) {
    if (isNotAnimatable(property)) {
      return;
    }
    var longProperties = shorthandToLonghand[property];
    if (longProperties) {
      shorthandExpanderElem.style[property] = value;
      for (var i in longProperties) {
        var longProperty = longProperties[i];
        var longhandValue = shorthandExpanderElem.style[longProperty];
        result[longProperty] = antiAlias(longProperty, longhandValue);
      }
    } else {
      result[property] = antiAlias(property, value);
    }
  };

  function convertToArrayForm(effectInput) {
    var normalizedEffectInput = [];

    for (var property in effectInput) {
      if (property in ['easing', 'offset', 'composite']) {
        continue;
      }

      var values = effectInput[property];
      if (!Array.isArray(values)) {
        values = [values];
      }

      var keyframe;
      var numKeyframes = values.length;
      for (var i = 0; i < numKeyframes; i++) {
        keyframe = {};

        if ('offset' in effectInput) {
          keyframe.offset = effectInput.offset;
        } else if (numKeyframes == 1) {
          keyframe.offset = 1.0;
        } else {
          keyframe.offset = i / (numKeyframes - 1.0);
        }

        if ('easing' in effectInput) {
          keyframe.easing = effectInput.easing;
        }

        if ('composite' in effectInput) {
          keyframe.composite = effectInput.composite;
        }

        keyframe[property] = values[i];

        normalizedEffectInput.push(keyframe);
      }
    }

    normalizedEffectInput.sort(function(a, b) { return a.offset - b.offset; });
    return normalizedEffectInput;
  };

  function normalizeKeyframes(effectInput) {
    if (effectInput == null) {
      return [];
    }

    if (window.Symbol && Symbol.iterator && Array.prototype.from && effectInput[Symbol.iterator]) {
      // Handle custom iterables in most browsers by converting to an array
      effectInput = Array.from(effectInput);
    }

    if (!Array.isArray(effectInput)) {
      effectInput = convertToArrayForm(effectInput);
    }

    var keyframes = effectInput.map(function(originalKeyframe) {
      var keyframe = {};
      for (var member in originalKeyframe) {
        var memberValue = originalKeyframe[member];
        if (member == 'offset') {
          if (memberValue != null) {
            memberValue = Number(memberValue);
            if (!isFinite(memberValue))
              throw new TypeError('Keyframe offsets must be numbers.');
            if (memberValue < 0 || memberValue > 1)
              throw new TypeError('Keyframe offsets must be between 0 and 1.');
          }
        } else if (member == 'composite') {
          if (memberValue == 'add' || memberValue == 'accumulate') {
            throw {
              type: DOMException.NOT_SUPPORTED_ERR,
              name: 'NotSupportedError',
              message: 'add compositing is not supported'
            };
          } else if (memberValue != 'replace') {
            throw new TypeError('Invalid composite mode ' + memberValue + '.');
          }
        } else if (member == 'easing') {
          memberValue = shared.normalizeEasing(memberValue);
        } else {
          memberValue = '' + memberValue;
        }
        expandShorthandAndAntiAlias(member, memberValue, keyframe);
      }
      if (keyframe.offset == undefined)
        keyframe.offset = null;
      if (keyframe.easing == undefined)
        keyframe.easing = 'linear';
      return keyframe;
    });

    var everyFrameHasOffset = true;
    var looselySortedByOffset = true;
    var previousOffset = -Infinity;
    for (var i = 0; i < keyframes.length; i++) {
      var offset = keyframes[i].offset;
      if (offset != null) {
        if (offset < previousOffset) {
          throw new TypeError('Keyframes are not loosely sorted by offset. Sort or specify offsets.');
        }
        previousOffset = offset;
      } else {
        everyFrameHasOffset = false;
      }
    }

    keyframes = keyframes.filter(function(keyframe) {
      return keyframe.offset >= 0 && keyframe.offset <= 1;
    });

    function spaceKeyframes() {
      var length = keyframes.length;
      if (keyframes[length - 1].offset == null)
        keyframes[length - 1].offset = 1;
      if (length > 1 && keyframes[0].offset == null)
        keyframes[0].offset = 0;

      var previousIndex = 0;
      var previousOffset = keyframes[0].offset;
      for (var i = 1; i < length; i++) {
        var offset = keyframes[i].offset;
        if (offset != null) {
          for (var j = 1; j < i - previousIndex; j++)
            keyframes[previousIndex + j].offset = previousOffset + (offset - previousOffset) * j / (i - previousIndex);
          previousIndex = i;
          previousOffset = offset;
        }
      }
    }
    if (!everyFrameHasOffset)
      spaceKeyframes();

    return keyframes;
  }

  shared.convertToArrayForm = convertToArrayForm;
  shared.normalizeKeyframes = normalizeKeyframes;

  if (WEB_ANIMATIONS_TESTING) {
    testing.normalizeKeyframes = normalizeKeyframes;
  }

})(webAnimationsShared, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared) {

  var silenced = {};

  shared.isDeprecated = function(feature, date, advice, plural) {
    if (WEB_ANIMATIONS_TESTING) {
      return true;
    }

    var auxVerb = plural ? 'are' : 'is';
    var today = new Date();
    var expiry = new Date(date);
    expiry.setMonth(expiry.getMonth() + 3); // 3 months grace period

    if (today < expiry) {
      if (!(feature in silenced)) {
        console.warn('Web Animations: ' + feature + ' ' + auxVerb + ' deprecated and will stop working on ' + expiry.toDateString() + '. ' + advice);
      }
      silenced[feature] = true;
      return false;
    } else {
      return true;
    }
  };

  shared.deprecated = function(feature, date, advice, plural) {
    var auxVerb = plural ? 'are' : 'is';
    if (shared.isDeprecated(feature, date, advice, plural)) {
      throw new Error(feature + ' ' + auxVerb + ' no longer supported. ' + advice);
    }
  };

})(webAnimationsShared);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  scope.convertEffectInput = function(effectInput) {
    var keyframes = shared.normalizeKeyframes(effectInput);
    var propertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups(keyframes);
    var interpolations = makeInterpolations(propertySpecificKeyframeGroups);
    return function(target, fraction) {
      if (fraction != null) {
        interpolations.filter(function(interpolation) {
          return fraction >= interpolation.applyFrom && fraction < interpolation.applyTo;
        }).forEach(function(interpolation) {
          var offsetFraction = fraction - interpolation.startOffset;
          var localDuration = interpolation.endOffset - interpolation.startOffset;
          var scaledLocalTime = localDuration == 0 ? 0 : interpolation.easingFunction(offsetFraction / localDuration);
          scope.apply(target, interpolation.property, interpolation.interpolation(scaledLocalTime));
        });
      } else {
        for (var property in propertySpecificKeyframeGroups)
          if (property != 'offset' && property != 'easing' && property != 'composite')
            scope.clear(target, property);
      }
    };
  };


  function makePropertySpecificKeyframeGroups(keyframes) {
    var propertySpecificKeyframeGroups = {};

    for (var i = 0; i < keyframes.length; i++) {
      for (var member in keyframes[i]) {
        if (member != 'offset' && member != 'easing' && member != 'composite') {
          var propertySpecificKeyframe = {
            offset: keyframes[i].offset,
            easing: keyframes[i].easing,
            value: keyframes[i][member]
          };
          propertySpecificKeyframeGroups[member] = propertySpecificKeyframeGroups[member] || [];
          propertySpecificKeyframeGroups[member].push(propertySpecificKeyframe);
        }
      }
    }

    for (var groupName in propertySpecificKeyframeGroups) {
      var group = propertySpecificKeyframeGroups[groupName];
      if (group[0].offset != 0 || group[group.length - 1].offset != 1) {
        throw {
          type: DOMException.NOT_SUPPORTED_ERR,
          name: 'NotSupportedError',
          message: 'Partial keyframes are not supported'
        };
      }
    }
    return propertySpecificKeyframeGroups;
  }


  function makeInterpolations(propertySpecificKeyframeGroups) {
    var interpolations = [];
    for (var groupName in propertySpecificKeyframeGroups) {
      var keyframes = propertySpecificKeyframeGroups[groupName];
      for (var i = 0; i < keyframes.length - 1; i++) {
        var startIndex = i;
        var endIndex = i + 1;
        var startOffset = keyframes[startIndex].offset;
        var endOffset = keyframes[endIndex].offset;
        var applyFrom = startOffset;
        var applyTo = endOffset;

        if (i == 0) {
          applyFrom = -Infinity;
          WEB_ANIMATIONS_TESTING && console.assert(startOffset == 0);
          if (endOffset == 0) {
            endIndex = startIndex;
          }
        }
        if (i == keyframes.length - 2) {
          applyTo = Infinity;
          WEB_ANIMATIONS_TESTING && console.assert(endOffset == 1);
          if (startOffset == 1) {
            startIndex = endIndex;
          }
        }

        interpolations.push({
          applyFrom: applyFrom,
          applyTo: applyTo,
          startOffset: keyframes[startIndex].offset,
          endOffset: keyframes[endIndex].offset,
          easingFunction: shared.parseEasingFunction(keyframes[startIndex].easing),
          property: groupName,
          interpolation: scope.propertyInterpolation(groupName,
              keyframes[startIndex].value,
              keyframes[endIndex].value)
        });
      }
    }
    interpolations.sort(function(leftInterpolation, rightInterpolation) {
      return leftInterpolation.startOffset - rightInterpolation.startOffset;
    });
    return interpolations;
  }


  if (WEB_ANIMATIONS_TESTING) {
    testing.makePropertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups;
    testing.makeInterpolations = makeInterpolations;
  }

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  var propertyHandlers = {};

  function toCamelCase(property) {
    return property.replace(/-(.)/g, function(_, c) {
      return c.toUpperCase();
    });
  }

  function addPropertyHandler(parser, merger, property) {
    propertyHandlers[property] = propertyHandlers[property] || [];
    propertyHandlers[property].push([parser, merger]);
  }
  function addPropertiesHandler(parser, merger, properties) {
    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      WEB_ANIMATIONS_TESTING && console.assert(property.toLowerCase() === property);
      addPropertyHandler(parser, merger, toCamelCase(property));
    }
  }
  scope.addPropertiesHandler = addPropertiesHandler;

  var initialValues = {
    backgroundColor: 'transparent',
    backgroundPosition: '0% 0%',
    borderBottomColor: 'currentColor',
    borderBottomLeftRadius: '0px',
    borderBottomRightRadius: '0px',
    borderBottomWidth: '3px',
    borderLeftColor: 'currentColor',
    borderLeftWidth: '3px',
    borderRightColor: 'currentColor',
    borderRightWidth: '3px',
    // Spec says this should be 0 but in practise it is 2px.
    borderSpacing: '2px',
    borderTopColor: 'currentColor',
    borderTopLeftRadius: '0px',
    borderTopRightRadius: '0px',
    borderTopWidth: '3px',
    bottom: 'auto',
    clip: 'rect(0px, 0px, 0px, 0px)',
    color: 'black', // Depends on user agent.
    fontSize: '100%',
    fontWeight: '400',
    height: 'auto',
    left: 'auto',
    letterSpacing: 'normal',
    lineHeight: '120%',
    marginBottom: '0px',
    marginLeft: '0px',
    marginRight: '0px',
    marginTop: '0px',
    maxHeight: 'none',
    maxWidth: 'none',
    minHeight: '0px',
    minWidth: '0px',
    opacity: '1.0',
    outlineColor: 'invert',
    outlineOffset: '0px',
    outlineWidth: '3px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    right: 'auto',
    strokeDasharray: 'none',
    strokeDashoffset: '0px',
    textIndent: '0px',
    textShadow: '0px 0px 0px transparent',
    top: 'auto',
    transform: '',
    verticalAlign: '0px',
    visibility: 'visible',
    width: 'auto',
    wordSpacing: 'normal',
    zIndex: 'auto'
  };

  function propertyInterpolation(property, left, right) {
    var ucProperty = property;
    if (/-/.test(property) && !shared.isDeprecated('Hyphenated property names', '2016-03-22', 'Use camelCase instead.', true)) {
      ucProperty = toCamelCase(property);
    }
    if (left == 'initial' || right == 'initial') {
      if (left == 'initial')
        left = initialValues[ucProperty];
      if (right == 'initial')
        right = initialValues[ucProperty];
    }
    var handlers = left == right ? [] : propertyHandlers[ucProperty];
    for (var i = 0; handlers && i < handlers.length; i++) {
      var parsedLeft = handlers[i][0](left);
      var parsedRight = handlers[i][0](right);
      if (parsedLeft !== undefined && parsedRight !== undefined) {
        var interpolationArgs = handlers[i][1](parsedLeft, parsedRight);
        if (interpolationArgs) {
          var interp = scope.Interpolation.apply(null, interpolationArgs);
          return function(t) {
            if (t == 0) return left;
            if (t == 1) return right;
            return interp(t);
          };
        }
      }
    }
    return scope.Interpolation(false, true, function(bool) {
      return bool ? right : left;
    });
  }
  scope.propertyInterpolation = propertyInterpolation;

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  function EffectTime(timing) {
    var timeFraction = 0;
    var activeDuration = shared.calculateActiveDuration(timing);
    var effectTime = function(localTime) {
      return shared.calculateIterationProgress(activeDuration, localTime, timing);
    };
    effectTime._totalDuration = timing.delay + activeDuration + timing.endDelay;
    return effectTime;
  }

  scope.KeyframeEffect = function(target, effectInput, timingInput, id) {
    var effectTime = EffectTime(shared.normalizeTimingInput(timingInput));
    var interpolations = scope.convertEffectInput(effectInput);
    var timeFraction;
    var keyframeEffect = function() {
      WEB_ANIMATIONS_TESTING && console.assert(typeof timeFraction !== 'undefined');
      interpolations(target, timeFraction);
    };
    // Returns whether the keyframeEffect is in effect or not after the timing update.
    keyframeEffect._update = function(localTime) {
      timeFraction = effectTime(localTime);
      return timeFraction !== null;
    };
    keyframeEffect._clear = function() {
      interpolations(target, null);
    };
    keyframeEffect._hasSameTarget = function(otherTarget) {
      return target === otherTarget;
    };
    keyframeEffect._target = target;
    keyframeEffect._totalDuration = effectTime._totalDuration;
    keyframeEffect._id = id;
    return keyframeEffect;
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.webAnimations1KeyframeEffect = scope.KeyframeEffect;
    testing.effectTime = EffectTime;
  }

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var styleAttributes = {
    cssText: 1,
    length: 1,
    parentRule: 1,
  };

  var styleMethods = {
    getPropertyCSSValue: 1,
    getPropertyPriority: 1,
    getPropertyValue: 1,
    item: 1,
    removeProperty: 1,
    setProperty: 1,
  };

  var styleMutatingMethods = {
    removeProperty: 1,
    setProperty: 1,
  };

  function configureProperty(object, property, descriptor) {
    descriptor.enumerable = true;
    descriptor.configurable = true;
    Object.defineProperty(object, property, descriptor);
  }

  function AnimatedCSSStyleDeclaration(element) {
    WEB_ANIMATIONS_TESTING && console.assert(!(element.style instanceof AnimatedCSSStyleDeclaration),
        'Element must not already have an animated style attached.');

    // Stores the inline style of the element on its behalf while the
    // polyfill uses the element's inline style to simulate web animations.
    // This is needed to fake regular inline style CSSOM access on the element.
    this._surrogateStyle = document.createElementNS('http://www.w3.org/1999/xhtml', 'div').style;
    this._style = element.style;
    this._length = 0;
    this._isAnimatedProperty = {};

    // Copy the inline style contents over to the surrogate.
    for (var i = 0; i < this._style.length; i++) {
      var property = this._style[i];
      this._surrogateStyle[property] = this._style[property];
    }
    this._updateIndices();
  }

  AnimatedCSSStyleDeclaration.prototype = {
    get cssText() {
      return this._surrogateStyle.cssText;
    },
    set cssText(text) {
      var isAffectedProperty = {};
      for (var i = 0; i < this._surrogateStyle.length; i++) {
        isAffectedProperty[this._surrogateStyle[i]] = true;
      }
      this._surrogateStyle.cssText = text;
      this._updateIndices();
      for (var i = 0; i < this._surrogateStyle.length; i++) {
        isAffectedProperty[this._surrogateStyle[i]] = true;
      }
      for (var property in isAffectedProperty) {
        if (!this._isAnimatedProperty[property]) {
          this._style.setProperty(property, this._surrogateStyle.getPropertyValue(property));
        }
      }
    },
    get length() {
      return this._surrogateStyle.length;
    },
    get parentRule() {
      return this._style.parentRule;
    },
    // Mirror the indexed getters and setters of the surrogate style.
    _updateIndices: function() {
      while (this._length < this._surrogateStyle.length) {
        Object.defineProperty(this, this._length, {
          configurable: true,
          enumerable: false,
          get: (function(index) {
            return function() { return this._surrogateStyle[index]; };
          })(this._length)
        });
        this._length++;
      }
      while (this._length > this._surrogateStyle.length) {
        this._length--;
        Object.defineProperty(this, this._length, {
          configurable: true,
          enumerable: false,
          value: undefined
        });
      }
    },
    _set: function(property, value) {
      this._style[property] = value;
      this._isAnimatedProperty[property] = true;
    },
    _clear: function(property) {
      this._style[property] = this._surrogateStyle[property];
      delete this._isAnimatedProperty[property];
    },
  };

  // Wrap the style methods.
  for (var method in styleMethods) {
    AnimatedCSSStyleDeclaration.prototype[method] = (function(method, modifiesStyle) {
      return function() {
        var result = this._surrogateStyle[method].apply(this._surrogateStyle, arguments);
        if (modifiesStyle) {
          if (!this._isAnimatedProperty[arguments[0]])
            this._style[method].apply(this._style, arguments);
          this._updateIndices();
        }
        return result;
      }
    })(method, method in styleMutatingMethods);
  }

  // Wrap the style.cssProperty getters and setters.
  for (var property in document.documentElement.style) {
    if (property in styleAttributes || property in styleMethods) {
      continue;
    }
    (function(property) {
      configureProperty(AnimatedCSSStyleDeclaration.prototype, property, {
        get: function() {
          return this._surrogateStyle[property];
        },
        set: function(value) {
          this._surrogateStyle[property] = value;
          this._updateIndices();
          if (!this._isAnimatedProperty[property])
            this._style[property] = value;
        }
      });
    })(property);
  }

  function ensureStyleIsPatched(element) {
    if (element._webAnimationsPatchedStyle)
      return;

    var animatedStyle = new AnimatedCSSStyleDeclaration(element);
    try {
      configureProperty(element, 'style', { get: function() { return animatedStyle; } });
    } catch (_) {
      // iOS and older versions of Safari (pre v7) do not support overriding an element's
      // style object. Animations will clobber any inline styles as a result.
      element.style._set = function(property, value) {
        element.style[property] = value;
      };
      element.style._clear = function(property) {
        element.style[property] = '';
      };
    }

    // We must keep a handle on the patched style to prevent it from getting GC'd.
    element._webAnimationsPatchedStyle = element.style;
  }

  scope.apply = function(element, property, value) {
    ensureStyleIsPatched(element);
    element.style._set(scope.propertyName(property), value);
  };

  scope.clear = function(element, property) {
    if (element._webAnimationsPatchedStyle) {
      element.style._clear(scope.propertyName(property));
    }
  };

  if (WEB_ANIMATIONS_TESTING)
    testing.ensureStyleIsPatched = ensureStyleIsPatched;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {
  window.Element.prototype.animate = function(effectInput, options) {
    var id = '';
    if (options && options.id) {
      id = options.id;
    }
    return scope.timeline._play(scope.KeyframeEffect(this, effectInput, options, id));
  };
})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function interpolate(from, to, f) {
    if ((typeof from == 'number') && (typeof to == 'number')) {
      return from * (1 - f) + to * f;
    }
    if ((typeof from == 'boolean') && (typeof to == 'boolean')) {
      return f < 0.5 ? from : to;
    }

    WEB_ANIMATIONS_TESTING && console.assert(
        Array.isArray(from) && Array.isArray(to),
        'If interpolation arguments are not numbers or bools they must be arrays');

    if (from.length == to.length) {
      var r = [];
      for (var i = 0; i < from.length; i++) {
        r.push(interpolate(from[i], to[i], f));
      }
      return r;
    }
    throw 'Mismatched interpolation arguments ' + from + ':' + to;
  }

  scope.Interpolation = function(from, to, convertToString) {
    return function(f) {
      return convertToString(interpolate(from, to, f));
    }
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.interpolate = interpolate;
  }

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {
  var composeMatrix = (function() {
    function multiply(a, b) {
      var result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
          for (var k = 0; k < 4; k++) {
            result[i][j] += b[i][k] * a[k][j];
          }
        }
      }
      return result;
    }

    function is2D(m) {
      return (
          m[0][2] == 0 &&
          m[0][3] == 0 &&
          m[1][2] == 0 &&
          m[1][3] == 0 &&
          m[2][0] == 0 &&
          m[2][1] == 0 &&
          m[2][2] == 1 &&
          m[2][3] == 0 &&
          m[3][2] == 0 &&
          m[3][3] == 1);
    }

    function composeMatrix(translate, scale, skew, quat, perspective) {
      var matrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

      for (var i = 0; i < 4; i++) {
        matrix[i][3] = perspective[i];
      }

      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          matrix[3][i] += translate[j] * matrix[j][i];
        }
      }

      var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

      var rotMatrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

      rotMatrix[0][0] = 1 - 2 * (y * y + z * z);
      rotMatrix[0][1] = 2 * (x * y - z * w);
      rotMatrix[0][2] = 2 * (x * z + y * w);
      rotMatrix[1][0] = 2 * (x * y + z * w);
      rotMatrix[1][1] = 1 - 2 * (x * x + z * z);
      rotMatrix[1][2] = 2 * (y * z - x * w);
      rotMatrix[2][0] = 2 * (x * z - y * w);
      rotMatrix[2][1] = 2 * (y * z + x * w);
      rotMatrix[2][2] = 1 - 2 * (x * x + y * y);

      matrix = multiply(matrix, rotMatrix);

      var temp = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
      if (skew[2]) {
        temp[2][1] = skew[2];
        matrix = multiply(matrix, temp);
      }

      if (skew[1]) {
        temp[2][1] = 0;
        temp[2][0] = skew[0];
        matrix = multiply(matrix, temp);
      }

      if (skew[0]) {
        temp[2][0] = 0;
        temp[1][0] = skew[0];
        matrix = multiply(matrix, temp);
      }

      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          matrix[i][j] *= scale[i];
        }
      }

      if (is2D(matrix)) {
        return [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[3][0], matrix[3][1]];
      }
      return matrix[0].concat(matrix[1], matrix[2], matrix[3]);
    }
    return composeMatrix;
  })();

  function clamp(x, min, max) {
    return Math.max(Math.min(x, max), min);
  };

  function quat(fromQ, toQ, f) {
    var product = scope.dot(fromQ, toQ);
    product = clamp(product, -1.0, 1.0);

    var quat = [];
    if (product === 1.0) {
      quat = fromQ;
    } else {
      var theta = Math.acos(product);
      var w = Math.sin(f * theta) * 1 / Math.sqrt(1 - product * product);

      for (var i = 0; i < 4; i++) {
        quat.push(fromQ[i] * (Math.cos(f * theta) - product * w) +
                  toQ[i] * w);
      }
    }
    return quat;
  }

  scope.composeMatrix = composeMatrix;
  scope.quat = quat;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  shared.sequenceNumber = 0;

  var AnimationEvent = function(target, currentTime, timelineTime) {
    this.target = target;
    this.currentTime = currentTime;
    this.timelineTime = timelineTime;

    this.type = 'finish';
    this.bubbles = false;
    this.cancelable = false;
    this.currentTarget = target;
    this.defaultPrevented = false;
    this.eventPhase = Event.AT_TARGET;
    this.timeStamp = Date.now();
  };

  scope.Animation = function(effect) {
    this.id = '';
    if (effect && effect._id) {
      this.id = effect._id;
    }
    this._sequenceNumber = shared.sequenceNumber++;
    this._currentTime = 0;
    this._startTime = null;
    this._paused = false;
    this._playbackRate = 1;
    this._inTimeline = true;
    this._finishedFlag = true;
    this.onfinish = null;
    this._finishHandlers = [];
    this._effect = effect;
    this._inEffect = this._effect._update(0);
    this._idle = true;
    this._currentTimePending = false;
  };

  scope.Animation.prototype = {
    _ensureAlive: function() {
      // If an animation is playing backwards and is not fill backwards/both
      // then it should go out of effect when it reaches the start of its
      // active interval (currentTime == 0).
      if (this.playbackRate < 0 && this.currentTime === 0) {
        this._inEffect = this._effect._update(-1);
      } else {
        this._inEffect = this._effect._update(this.currentTime);
      }
      if (!this._inTimeline && (this._inEffect || !this._finishedFlag)) {
        this._inTimeline = true;
        scope.timeline._animations.push(this);
      }
    },
    _tickCurrentTime: function(newTime, ignoreLimit) {
      if (newTime != this._currentTime) {
        this._currentTime = newTime;
        if (this._isFinished && !ignoreLimit)
          this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
        this._ensureAlive();
      }
    },
    get currentTime() {
      if (this._idle || this._currentTimePending)
        return null;
      return this._currentTime;
    },
    set currentTime(newTime) {
      newTime = +newTime;
      if (isNaN(newTime))
        return;
      scope.restart();
      if (!this._paused && this._startTime != null) {
        this._startTime = this._timeline.currentTime - newTime / this._playbackRate;
      }
      this._currentTimePending = false;
      if (this._currentTime == newTime)
        return;
      if (this._idle) {
        this._idle = false;
        this._paused = true;
      }
      this._tickCurrentTime(newTime, true);
      scope.applyDirtiedAnimation(this);
    },
    get startTime() {
      return this._startTime;
    },
    set startTime(newTime) {
      newTime = +newTime;
      if (isNaN(newTime))
        return;
      if (this._paused || this._idle)
        return;
      this._startTime = newTime;
      this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate);
      scope.applyDirtiedAnimation(this);
    },
    get playbackRate() {
      return this._playbackRate;
    },
    set playbackRate(value) {
      if (value == this._playbackRate) {
        return;
      }
      var oldCurrentTime = this.currentTime;
      this._playbackRate = value;
      this._startTime = null;
      if (this.playState != 'paused' && this.playState != 'idle') {
        this._finishedFlag = false;
        this._idle = false;
        this._ensureAlive();
        scope.applyDirtiedAnimation(this);
      }
      if (oldCurrentTime != null) {
        this.currentTime = oldCurrentTime;
      }
    },
    get _isFinished() {
      return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration ||
          this._playbackRate < 0 && this._currentTime <= 0);
    },
    get _totalDuration() { return this._effect._totalDuration; },
    get playState() {
      if (this._idle)
        return 'idle';
      if ((this._startTime == null && !this._paused && this.playbackRate != 0) || this._currentTimePending)
        return 'pending';
      if (this._paused)
        return 'paused';
      if (this._isFinished)
        return 'finished';
      return 'running';
    },
    _rewind: function() {
      if (this._playbackRate >= 0) {
        this._currentTime = 0;
      } else if (this._totalDuration < Infinity) {
        this._currentTime = this._totalDuration;
      } else {
        throw new DOMException(
            'Unable to rewind negative playback rate animation with infinite duration',
            'InvalidStateError');
      }
    },
    play: function() {
      this._paused = false;
      if (this._isFinished || this._idle) {
        this._rewind();
        this._startTime = null;
      }
      this._finishedFlag = false;
      this._idle = false;
      this._ensureAlive();
      scope.applyDirtiedAnimation(this);
    },
    pause: function() {
      if (!this._isFinished && !this._paused && !this._idle) {
        this._currentTimePending = true;
      } else if (this._idle) {
        this._rewind();
        this._idle = false;
      }
      this._startTime = null;
      this._paused = true;
    },
    finish: function() {
      if (this._idle)
        return;
      this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
      this._startTime = this._totalDuration - this.currentTime;
      this._currentTimePending = false;
      scope.applyDirtiedAnimation(this);
    },
    cancel: function() {
      if (!this._inEffect)
        return;
      this._inEffect = false;
      this._idle = true;
      this._paused = false;
      this._isFinished = true;
      this._finishedFlag = true;
      this._currentTime = 0;
      this._startTime = null;
      this._effect._update(null);
      // effects are invalid after cancellation as the animation state
      // needs to un-apply.
      scope.applyDirtiedAnimation(this);
    },
    reverse: function() {
      this.playbackRate *= -1;
      this.play();
    },
    addEventListener: function(type, handler) {
      if (typeof handler == 'function' && type == 'finish')
        this._finishHandlers.push(handler);
    },
    removeEventListener: function(type, handler) {
      if (type != 'finish')
        return;
      var index = this._finishHandlers.indexOf(handler);
      if (index >= 0)
        this._finishHandlers.splice(index, 1);
    },
    _fireEvents: function(baseTime) {
      if (this._isFinished) {
        if (!this._finishedFlag) {
          var event = new AnimationEvent(this, this._currentTime, baseTime);
          var handlers = this._finishHandlers.concat(this.onfinish ? [this.onfinish] : []);
          setTimeout(function() {
            handlers.forEach(function(handler) {
              handler.call(event.target, event);
            });
          }, 0);
          this._finishedFlag = true;
        }
      } else {
        this._finishedFlag = false;
      }
    },
    _tick: function(timelineTime, isAnimationFrame) {
      if (!this._idle && !this._paused) {
        if (this._startTime == null) {
          if (isAnimationFrame) {
            this.startTime = timelineTime - this._currentTime / this.playbackRate;
          }
        } else if (!this._isFinished) {
          this._tickCurrentTime((timelineTime - this._startTime) * this.playbackRate);
        }
      }

      if (isAnimationFrame) {
        this._currentTimePending = false;
        this._fireEvents(timelineTime);
      }
    },
    get _needsTick() {
      return (this.playState in {'pending': 1, 'running': 1}) || !this._finishedFlag;
    },
    _targetAnimations: function() {
      var target = this._effect._target;
      if (!target._activeAnimations) {
        target._activeAnimations = [];
      }
      return target._activeAnimations;
    },
    _markTarget: function() {
      var animations = this._targetAnimations();
      if (animations.indexOf(this) === -1) {
        animations.push(this);
      }
    },
    _unmarkTarget: function() {
      var animations = this._targetAnimations();
      var index = animations.indexOf(this);
      if (index !== -1) {
        animations.splice(index, 1);
      }
    },
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.webAnimations1Animation = scope.Animation;
  }

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.


(function(shared, scope, testing) {
  var originalRequestAnimationFrame = window.requestAnimationFrame;
  var rafCallbacks = [];
  var rafId = 0;
  window.requestAnimationFrame = function(f) {
    var id = rafId++;
    if (rafCallbacks.length == 0 && !WEB_ANIMATIONS_TESTING) {
      originalRequestAnimationFrame(processRafCallbacks);
    }
    rafCallbacks.push([id, f]);
    return id;
  };

  window.cancelAnimationFrame = function(id) {
    rafCallbacks.forEach(function(entry) {
      if (entry[0] == id) {
        entry[1] = function() {};
      }
    });
  };

  function processRafCallbacks(t) {
    var processing = rafCallbacks;
    rafCallbacks = [];
    if (t < timeline.currentTime)
      t = timeline.currentTime;
    timeline._animations.sort(compareAnimations);
    timeline._animations = tick(t, true, timeline._animations)[0];
    processing.forEach(function(entry) { entry[1](t); });
    applyPendingEffects();
    _now = undefined;
  }

  function compareAnimations(leftAnimation, rightAnimation) {
    return leftAnimation._sequenceNumber - rightAnimation._sequenceNumber;
  }

  function InternalTimeline() {
    this._animations = [];
    // Android 4.3 browser has window.performance, but not window.performance.now
    this.currentTime = window.performance && performance.now ? performance.now() : 0;
  };

  InternalTimeline.prototype = {
    _play: function(effect) {
      effect._timing = shared.normalizeTimingInput(effect.timing);
      var animation = new scope.Animation(effect);
      animation._idle = false;
      animation._timeline = this;
      this._animations.push(animation);
      scope.restart();
      scope.applyDirtiedAnimation(animation);
      return animation;
    }
  };

  var _now = undefined;

  if (WEB_ANIMATIONS_TESTING) {
    var now = function() { return timeline.currentTime; };
  } else {
    var now = function() {
      if (_now == undefined)
        _now = window.performance && performance.now ? performance.now() : Date.now();
      return _now;
    };
  }

  var ticking = false;
  var hasRestartedThisFrame = false;

  scope.restart = function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function() {});
      hasRestartedThisFrame = true;
    }
    return hasRestartedThisFrame;
  };

  // RAF is supposed to be the last script to occur before frame rendering but not
  // all browsers behave like this. This function is for synchonously updating an
  // animation's effects whenever its state is mutated by script to work around
  // incorrect script execution ordering by the browser.
  scope.applyDirtiedAnimation = function(animation) {
    if (inTick) {
      return;
    }
    animation._markTarget();
    var animations = animation._targetAnimations();
    animations.sort(compareAnimations);
    var inactiveAnimations = tick(scope.timeline.currentTime, false, animations.slice())[1];
    inactiveAnimations.forEach(function(animation) {
      var index = timeline._animations.indexOf(animation);
      if (index !== -1) {
        timeline._animations.splice(index, 1);
      }
    });
    applyPendingEffects();
  };

  var pendingEffects = [];
  function applyPendingEffects() {
    pendingEffects.forEach(function(f) { f(); });
    pendingEffects.length = 0;
  }

  var t60hz = 1000 / 60;

  var inTick = false;
  function tick(t, isAnimationFrame, updatingAnimations) {
    inTick = true;
    hasRestartedThisFrame = false;
    var timeline = scope.timeline;

    timeline.currentTime = t;
    ticking = false;

    var newPendingClears = [];
    var newPendingEffects = [];
    var activeAnimations = [];
    var inactiveAnimations = [];
    updatingAnimations.forEach(function(animation) {
      animation._tick(t, isAnimationFrame);

      if (!animation._inEffect) {
        newPendingClears.push(animation._effect);
        animation._unmarkTarget();
      } else {
        newPendingEffects.push(animation._effect);
        animation._markTarget();
      }

      if (animation._needsTick)
        ticking = true;

      var alive = animation._inEffect || animation._needsTick;
      animation._inTimeline = alive;
      if (alive) {
        activeAnimations.push(animation);
      } else {
        inactiveAnimations.push(animation);
      }
    });

    // FIXME: Should remove dupliactes from pendingEffects.
    pendingEffects.push.apply(pendingEffects, newPendingClears);
    pendingEffects.push.apply(pendingEffects, newPendingEffects);

    if (ticking)
      requestAnimationFrame(function() {});

    inTick = false;
    return [activeAnimations, inactiveAnimations];
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.tick = function(t) { timeline.currentTime = t; processRafCallbacks(t); };
    testing.isTicking = function() { return ticking; };
    testing.setTicking = function(newVal) { ticking = newVal; };
  }

  var timeline = new InternalTimeline();
  scope.timeline = timeline;

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {
  var decomposeMatrix = (function() {
    function determinant(m) {
      return m[0][0] * m[1][1] * m[2][2] +
             m[1][0] * m[2][1] * m[0][2] +
             m[2][0] * m[0][1] * m[1][2] -
             m[0][2] * m[1][1] * m[2][0] -
             m[1][2] * m[2][1] * m[0][0] -
             m[2][2] * m[0][1] * m[1][0];
    }

    // from Wikipedia:
    //
    // [A B]^-1 = [A^-1 + A^-1B(D - CA^-1B)^-1CA^-1     -A^-1B(D - CA^-1B)^-1]
    // [C D]      [-(D - CA^-1B)^-1CA^-1                (D - CA^-1B)^-1      ]
    //
    // Therefore
    //
    // [A [0]]^-1 = [A^-1       [0]]
    // [C  1 ]      [ -CA^-1     1 ]
    function inverse(m) {
      var iDet = 1 / determinant(m);
      var a = m[0][0], b = m[0][1], c = m[0][2];
      var d = m[1][0], e = m[1][1], f = m[1][2];
      var g = m[2][0], h = m[2][1], k = m[2][2];
      var Ainv = [
        [(e * k - f * h) * iDet, (c * h - b * k) * iDet,
         (b * f - c * e) * iDet, 0],
        [(f * g - d * k) * iDet, (a * k - c * g) * iDet,
         (c * d - a * f) * iDet, 0],
        [(d * h - e * g) * iDet, (g * b - a * h) * iDet,
         (a * e - b * d) * iDet, 0]
      ];
      var lastRow = [];
      for (var i = 0; i < 3; i++) {
        var val = 0;
        for (var j = 0; j < 3; j++) {
          val += m[3][j] * Ainv[j][i];
        }
        lastRow.push(val);
      }
      lastRow.push(1);
      Ainv.push(lastRow);
      return Ainv;
    }

    function transposeMatrix4(m) {
      return [[m[0][0], m[1][0], m[2][0], m[3][0]],
              [m[0][1], m[1][1], m[2][1], m[3][1]],
              [m[0][2], m[1][2], m[2][2], m[3][2]],
              [m[0][3], m[1][3], m[2][3], m[3][3]]];
    }

    function multVecMatrix(v, m) {
      var result = [];
      for (var i = 0; i < 4; i++) {
        var val = 0;
        for (var j = 0; j < 4; j++) {
          val += v[j] * m[j][i];
        }
        result.push(val);
      }
      return result;
    }

    function normalize(v) {
      var len = length(v);
      return [v[0] / len, v[1] / len, v[2] / len];
    }

    function length(v) {
      return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    function combine(v1, v2, v1s, v2s) {
      return [v1s * v1[0] + v2s * v2[0], v1s * v1[1] + v2s * v2[1],
              v1s * v1[2] + v2s * v2[2]];
    }

    function cross(v1, v2) {
      return [v1[1] * v2[2] - v1[2] * v2[1],
              v1[2] * v2[0] - v1[0] * v2[2],
              v1[0] * v2[1] - v1[1] * v2[0]];
    }

    function decomposeMatrix(matrix) {
      var m3d = [
        matrix.slice(0, 4),
        matrix.slice(4, 8),
        matrix.slice(8, 12),
        matrix.slice(12, 16)
      ];

      // skip normalization step as m3d[3][3] should always be 1
      if (m3d[3][3] !== 1) {
        return null;
      }

      var perspectiveMatrix = [];
      for (var i = 0; i < 4; i++) {
        perspectiveMatrix.push(m3d[i].slice());
      }

      for (var i = 0; i < 3; i++) {
        perspectiveMatrix[i][3] = 0;
      }

      if (determinant(perspectiveMatrix) === 0) {
        return null;
      }

      var rhs = [];

      var perspective;
      if (m3d[0][3] || m3d[1][3] || m3d[2][3]) {
        rhs.push(m3d[0][3]);
        rhs.push(m3d[1][3]);
        rhs.push(m3d[2][3]);
        rhs.push(m3d[3][3]);

        var inversePerspectiveMatrix = inverse(perspectiveMatrix);
        var transposedInversePerspectiveMatrix =
            transposeMatrix4(inversePerspectiveMatrix);
        perspective = multVecMatrix(rhs, transposedInversePerspectiveMatrix);
      } else {
        perspective = [0, 0, 0, 1];
      }

      var translate = m3d[3].slice(0, 3);

      var row = [];
      row.push(m3d[0].slice(0, 3));
      var scale = [];
      scale.push(length(row[0]));
      row[0] = normalize(row[0]);

      var skew = [];
      row.push(m3d[1].slice(0, 3));
      skew.push(dot(row[0], row[1]));
      row[1] = combine(row[1], row[0], 1.0, -skew[0]);

      scale.push(length(row[1]));
      row[1] = normalize(row[1]);
      skew[0] /= scale[1];

      row.push(m3d[2].slice(0, 3));
      skew.push(dot(row[0], row[2]));
      row[2] = combine(row[2], row[0], 1.0, -skew[1]);
      skew.push(dot(row[1], row[2]));
      row[2] = combine(row[2], row[1], 1.0, -skew[2]);

      scale.push(length(row[2]));
      row[2] = normalize(row[2]);
      skew[1] /= scale[2];
      skew[2] /= scale[2];

      var pdum3 = cross(row[1], row[2]);
      if (dot(row[0], pdum3) < 0) {
        for (var i = 0; i < 3; i++) {
          scale[i] *= -1;
          row[i][0] *= -1;
          row[i][1] *= -1;
          row[i][2] *= -1;
        }
      }

      var t = row[0][0] + row[1][1] + row[2][2] + 1;
      var s;
      var quaternion;

      if (t > 1e-4) {
        s = 0.5 / Math.sqrt(t);
        quaternion = [
          (row[2][1] - row[1][2]) * s,
          (row[0][2] - row[2][0]) * s,
          (row[1][0] - row[0][1]) * s,
          0.25 / s
        ];
      } else if (row[0][0] > row[1][1] && row[0][0] > row[2][2]) {
        s = Math.sqrt(1 + row[0][0] - row[1][1] - row[2][2]) * 2.0;
        quaternion = [
          0.25 * s,
          (row[0][1] + row[1][0]) / s,
          (row[0][2] + row[2][0]) / s,
          (row[2][1] - row[1][2]) / s
        ];
      } else if (row[1][1] > row[2][2]) {
        s = Math.sqrt(1.0 + row[1][1] - row[0][0] - row[2][2]) * 2.0;
        quaternion = [
          (row[0][1] + row[1][0]) / s,
          0.25 * s,
          (row[1][2] + row[2][1]) / s,
          (row[0][2] - row[2][0]) / s
        ];
      } else {
        s = Math.sqrt(1.0 + row[2][2] - row[0][0] - row[1][1]) * 2.0;
        quaternion = [
          (row[0][2] + row[2][0]) / s,
          (row[1][2] + row[2][1]) / s,
          0.25 * s,
          (row[1][0] - row[0][1]) / s
        ];
      }

      return [translate, scale, skew, quaternion, perspective];
    }
    return decomposeMatrix;
  })();

  function dot(v1, v2) {
    var result = 0;
    for (var i = 0; i < v1.length; i++) {
      result += v1[i] * v2[i];
    }
    return result;
  }

  function multiplyMatrices(a, b) {
    return [
      a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3],
      a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3],
      a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3],
      a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3],

      a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7],
      a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7],
      a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7],
      a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7],

      a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11],
      a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11],
      a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11],
      a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11],

      a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15],
      a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15],
      a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15],
      a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
    ];
  }

  function toRadians(arg) {
    var rads = arg.rad || 0;
    var degs = arg.deg || 0;
    var grads = arg.grad || 0;
    var turns = arg.turn || 0;
    var angle = (degs / 360 + grads / 400 + turns) * (2 * Math.PI) + rads;
    return angle;
  }

  function convertItemToMatrix(item) {
    switch (item.t) {
      case 'rotatex':
        var angle = toRadians(item.d[0]);
        return [1, 0, 0, 0,
                0, Math.cos(angle), Math.sin(angle), 0,
                0, -Math.sin(angle), Math.cos(angle), 0,
                0, 0, 0, 1];
      case 'rotatey':
        var angle = toRadians(item.d[0]);
        return [Math.cos(angle), 0, -Math.sin(angle), 0,
                0, 1, 0, 0,
                Math.sin(angle), 0, Math.cos(angle), 0,
                0, 0, 0, 1];
      case 'rotate':
      case 'rotatez':
        var angle = toRadians(item.d[0]);
        return [Math.cos(angle), Math.sin(angle), 0, 0,
                -Math.sin(angle), Math.cos(angle), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'rotate3d':
        var x = item.d[0];
        var y = item.d[1];
        var z = item.d[2];
        var angle = toRadians(item.d[3]);

        var sqrLength = x * x + y * y + z * z;
        if (sqrLength === 0) {
          x = 1;
          y = 0;
          z = 0;
        } else if (sqrLength !== 1) {
          var length = Math.sqrt(sqrLength);
          x /= length;
          y /= length;
          z /= length;
        }

        var s = Math.sin(angle / 2);
        var sc = s * Math.cos(angle / 2);
        var sq = s * s;
        return [
          1 - 2 * (y * y + z * z) * sq,
          2 * (x * y * sq + z * sc),
          2 * (x * z * sq - y * sc),
          0,

          2 * (x * y * sq - z * sc),
          1 - 2 * (x * x + z * z) * sq,
          2 * (y * z * sq + x * sc),
          0,

          2 * (x * z * sq + y * sc),
          2 * (y * z * sq - x * sc),
          1 - 2 * (x * x + y * y) * sq,
          0,

          0, 0, 0, 1
        ];
      case 'scale':
        return [item.d[0], 0, 0, 0,
                0, item.d[1], 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'scalex':
        return [item.d[0], 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'scaley':
        return [1, 0, 0, 0,
                0, item.d[0], 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'scalez':
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, item.d[0], 0,
                0, 0, 0, 1];
      case 'scale3d':
        return [item.d[0], 0, 0, 0,
                0, item.d[1], 0, 0,
                0, 0, item.d[2], 0,
                0, 0, 0, 1];
      case 'skew':
        var xAngle = toRadians(item.d[0]);
        var yAngle = toRadians(item.d[1]);
        return [1, Math.tan(yAngle), 0, 0,
                Math.tan(xAngle), 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'skewx':
        var angle = toRadians(item.d[0]);
        return [1, 0, 0, 0,
                Math.tan(angle), 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'skewy':
        var angle = toRadians(item.d[0]);
        return [1, Math.tan(angle), 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];
      case 'translate':
        var x = item.d[0].px || 0;
        var y = item.d[1].px || 0;
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, 0, 1];
      case 'translatex':
        var x = item.d[0].px || 0;
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, 0, 0, 1];
      case 'translatey':
        var y = item.d[0].px || 0;
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, y, 0, 1];
      case 'translatez':
        var z = item.d[0].px || 0;
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, z, 1];
      case 'translate3d':
        var x = item.d[0].px || 0;
        var y = item.d[1].px || 0;
        var z = item.d[2].px || 0;
        return [1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1];
      case 'perspective':
        var p = item.d[0].px ? (-1 / item.d[0].px) : 0;
        return [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, p,
          0, 0, 0, 1];
      case 'matrix':
        return [item.d[0], item.d[1], 0, 0,
                item.d[2], item.d[3], 0, 0,
                0, 0, 1, 0,
                item.d[4], item.d[5], 0, 1];
      case 'matrix3d':
        return item.d;
      default:
        WEB_ANIMATIONS_TESTING && console.assert(false, 'Transform item type ' + item.t +
            ' conversion to matrix not yet implemented.');
    }
  }

  function convertToMatrix(transformList) {
    if (transformList.length === 0) {
      return [1, 0, 0, 0,
              0, 1, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1];
    }
    return transformList.map(convertItemToMatrix).reduce(multiplyMatrices);
  }

  function makeMatrixDecomposition(transformList) {
    return [decomposeMatrix(convertToMatrix(transformList))];
  }

  scope.dot = dot;
  scope.makeMatrixDecomposition = makeMatrixDecomposition;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  // consume* functions return a 2 value array of [parsed-data, '' or not-yet consumed input]

  // Regex should be anchored with /^
  function consumeToken(regex, string) {
    var result = regex.exec(string);
    if (result) {
      result = regex.ignoreCase ? result[0].toLowerCase() : result[0];
      return [result, string.substr(result.length)];
    }
  }

  function consumeTrimmed(consumer, string) {
    string = string.replace(/^\s*/, '');
    var result = consumer(string);
    if (result) {
      return [result[0], result[1].replace(/^\s*/, '')];
    }
  }

  function consumeRepeated(consumer, separator, string) {
    consumer = consumeTrimmed.bind(null, consumer);
    var list = [];
    while (true) {
      var result = consumer(string);
      if (!result) {
        return [list, string];
      }
      list.push(result[0]);
      string = result[1];
      result = consumeToken(separator, string);
      if (!result || result[1] == '') {
        return [list, string];
      }
      string = result[1];
    }
  }

  // Consumes a token or expression with balanced parentheses
  function consumeParenthesised(parser, string) {
    var nesting = 0;
    for (var n = 0; n < string.length; n++) {
      if (/\s|,/.test(string[n]) && nesting == 0) {
        break;
      } else if (string[n] == '(') {
        nesting++;
      } else if (string[n] == ')') {
        nesting--;
        if (nesting == 0)
          n++;
        if (nesting <= 0)
          break;
      }
    }
    var parsed = parser(string.substr(0, n));
    return parsed == undefined ? undefined : [parsed, string.substr(n)];
  }

  function lcm(a, b) {
    var c = a;
    var d = b;
    while (c && d)
      c > d ? c %= d : d %= c;
    c = (a * b) / (c + d);
    return c;
  }

  function ignore(value) {
    return function(input) {
      var result = value(input);
      if (result)
        result[0] = undefined;
      return result;
    }
  }

  function optional(value, defaultValue) {
    return function(input) {
      var result = value(input);
      if (result)
        return result;
      return [defaultValue, input];
    }
  }

  function consumeList(list, input) {
    var output = [];
    for (var i = 0; i < list.length; i++) {
      var result = scope.consumeTrimmed(list[i], input);
      if (!result || result[0] == '')
        return;
      if (result[0] !== undefined)
        output.push(result[0]);
      input = result[1];
    }
    if (input == '') {
      return output;
    }
  }

  function mergeWrappedNestedRepeated(wrap, nestedMerge, separator, left, right) {
    var matchingLeft = [];
    var matchingRight = [];
    var reconsititution = [];
    var length = lcm(left.length, right.length);
    for (var i = 0; i < length; i++) {
      var thing = nestedMerge(left[i % left.length], right[i % right.length]);
      if (!thing) {
        return;
      }
      matchingLeft.push(thing[0]);
      matchingRight.push(thing[1]);
      reconsititution.push(thing[2]);
    }
    return [matchingLeft, matchingRight, function(positions) {
      var result = positions.map(function(position, i) {
        return reconsititution[i](position);
      }).join(separator);
      return wrap ? wrap(result) : result;
    }];
  }

  function mergeList(left, right, list) {
    var lefts = [];
    var rights = [];
    var functions = [];
    var j = 0;
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] == 'function') {
        var result = list[i](left[j], right[j++]);
        lefts.push(result[0]);
        rights.push(result[1]);
        functions.push(result[2]);
      } else {
        (function(pos) {
          lefts.push(false);
          rights.push(false);
          functions.push(function() { return list[pos]; });
        })(i);
      }
    }
    return [lefts, rights, function(results) {
      var result = '';
      for (var i = 0; i < results.length; i++) {
        result += functions[i](results[i]);
      }
      return result;
    }];
  }

  scope.consumeToken = consumeToken;
  scope.consumeTrimmed = consumeTrimmed;
  scope.consumeRepeated = consumeRepeated;
  scope.consumeParenthesised = consumeParenthesised;
  scope.ignore = ignore;
  scope.optional = optional;
  scope.consumeList = consumeList;
  scope.mergeNestedRepeated = mergeWrappedNestedRepeated.bind(null, null);
  scope.mergeWrappedNestedRepeated = mergeWrappedNestedRepeated;
  scope.mergeList = mergeList;

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  function consumeShadow(string) {
    var shadow = {
      inset: false,
      lengths: [],
      color: null,
    };
    function consumePart(string) {
      var result = scope.consumeToken(/^inset/i, string);
      if (result) {
        shadow.inset = true;
        return result;
      }
      var result = scope.consumeLengthOrPercent(string);
      if (result) {
        shadow.lengths.push(result[0]);
        return result;
      }
      var result = scope.consumeColor(string);
      if (result) {
        shadow.color = result[0];
        return result;
      }
    }
    var result = scope.consumeRepeated(consumePart, /^/, string);
    if (result && result[0].length) {
      return [shadow, result[1]];
    }
  }

  function parseShadowList(string) {
    var result = scope.consumeRepeated(consumeShadow, /^,/, string);
    if (result && result[1] == '') {
      return result[0];
    }
  }

  function mergeShadow(left, right) {
    while (left.lengths.length < Math.max(left.lengths.length, right.lengths.length))
      left.lengths.push({px: 0});
    while (right.lengths.length < Math.max(left.lengths.length, right.lengths.length))
      right.lengths.push({px: 0});

    if (left.inset != right.inset || !!left.color != !!right.color) {
      return;
    }
    var lengthReconstitution = [];
    var colorReconstitution;
    var matchingLeft = [[], 0];
    var matchingRight = [[], 0];
    for (var i = 0; i < left.lengths.length; i++) {
      var mergedDimensions = scope.mergeDimensions(left.lengths[i], right.lengths[i], i == 2);
      matchingLeft[0].push(mergedDimensions[0]);
      matchingRight[0].push(mergedDimensions[1]);
      lengthReconstitution.push(mergedDimensions[2]);
    }
    if (left.color && right.color) {
      var mergedColor = scope.mergeColors(left.color, right.color);
      matchingLeft[1] = mergedColor[0];
      matchingRight[1] = mergedColor[1];
      colorReconstitution = mergedColor[2];
    }
    return [matchingLeft, matchingRight, function(value) {
      var result = left.inset ? 'inset ' : ' ';
      for (var i = 0; i < lengthReconstitution.length; i++) {
        result += lengthReconstitution[i](value[0][i]) + ' ';
      }
      if (colorReconstitution) {
        result += colorReconstitution(value[1]);
      }
      return result;
    }];
  }

  function mergeNestedRepeatedShadow(nestedMerge, separator, left, right) {
    var leftCopy = [];
    var rightCopy = [];
    function defaultShadow(inset) {
      return {inset: inset, color: [0, 0, 0, 0], lengths: [{px: 0}, {px: 0}, {px: 0}, {px: 0}]};
    }
    for (var i = 0; i < left.length || i < right.length; i++) {
      var l = left[i] || defaultShadow(right[i].inset);
      var r = right[i] || defaultShadow(left[i].inset);
      leftCopy.push(l);
      rightCopy.push(r);
    }
    return scope.mergeNestedRepeated(nestedMerge, separator, leftCopy, rightCopy);
  }

  var mergeShadowList = mergeNestedRepeatedShadow.bind(null, mergeShadow, ', ');
  scope.addPropertiesHandler(parseShadowList, mergeShadowList, ['box-shadow', 'text-shadow']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function numberToString(x) {
    return x.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  }

  function clamp(min, max, x) {
    return Math.min(max, Math.max(min, x));
  }

  function parseNumber(string) {
    if (/^\s*[-+]?(\d*\.)?\d+\s*$/.test(string))
      return Number(string);
  }

  function mergeNumbers(left, right) {
    return [left, right, numberToString];
  }

  // FIXME: This should probably go in it's own handler.
  function mergeFlex(left, right) {
    if (left == 0)
      return;
    return clampedMergeNumbers(0, Infinity)(left, right);
  }

  function mergePositiveIntegers(left, right) {
    return [left, right, function(x) {
      return Math.round(clamp(1, Infinity, x));
    }];
  }

  function clampedMergeNumbers(min, max) {
    return function(left, right) {
      return [left, right, function(x) {
        return numberToString(clamp(min, max, x));
      }];
    };
  }

  function parseNumberList(string) {
    var items = string.trim().split(/\s*[\s,]\s*/);
    if (items.length === 0) {
      return;
    }
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var number = parseNumber(items[i]);
      if (number === undefined) {
        return;
      }
      result.push(number);
    }
    return result;
  }

  function mergeNumberLists(left, right) {
    if (left.length != right.length) {
      return;
    }
    return [left, right, function(numberList) {
      return numberList.map(numberToString).join(' ');
    }];
  }

  function round(left, right) {
    return [left, right, Math.round];
  }

  scope.clamp = clamp;
  scope.addPropertiesHandler(parseNumberList, mergeNumberLists, ['stroke-dasharray']);
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, Infinity), ['border-image-width', 'line-height']);
  scope.addPropertiesHandler(parseNumber, clampedMergeNumbers(0, 1), ['opacity', 'shape-image-threshold']);
  scope.addPropertiesHandler(parseNumber, mergeFlex, ['flex-grow', 'flex-shrink']);
  scope.addPropertiesHandler(parseNumber, mergePositiveIntegers, ['orphans', 'widows']);
  scope.addPropertiesHandler(parseNumber, round, ['z-index']);

  scope.parseNumber = parseNumber;
  scope.parseNumberList = parseNumberList;
  scope.mergeNumbers = mergeNumbers;
  scope.numberToString = numberToString;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function merge(left, right) {
    if (left != 'visible' && right != 'visible') return;
    return [0, 1, function(x) {
      if (x <= 0) return left;
      if (x >= 1) return right;
      return 'visible';
    }];
  }

  scope.addPropertiesHandler(String, merge, ['visibility']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
  canvas.width = canvas.height = 1;
  var context = canvas.getContext('2d');

  function parseColor(string) {
    string = string.trim();
    // The context ignores invalid colors
    context.fillStyle = '#000';
    context.fillStyle = string;
    var contextSerializedFillStyle = context.fillStyle;
    context.fillStyle = '#fff';
    context.fillStyle = string;
    if (contextSerializedFillStyle != context.fillStyle)
      return;
    context.fillRect(0, 0, 1, 1);
    var pixelColor = context.getImageData(0, 0, 1, 1).data;
    context.clearRect(0, 0, 1, 1);
    var alpha = pixelColor[3] / 255;
    return [pixelColor[0] * alpha, pixelColor[1] * alpha, pixelColor[2] * alpha, alpha];
  }

  function mergeColors(left, right) {
    return [left, right, function(x) {
      function clamp(v) {
        return Math.max(0, Math.min(255, v));
      }
      if (x[3]) {
        for (var i = 0; i < 3; i++)
          x[i] = Math.round(clamp(x[i] / x[3]));
      }
      x[3] = scope.numberToString(scope.clamp(0, 1, x[3]));
      return 'rgba(' + x.join(',') + ')';
    }];
  }

  scope.addPropertiesHandler(parseColor, mergeColors,
      ['background-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
       'border-top-color', 'color', 'fill', 'flood-color', 'lighting-color',
       'outline-color', 'stop-color', 'stroke', 'text-decoration-color']);
  scope.consumeColor = scope.consumeParenthesised.bind(null, parseColor);
  scope.mergeColors = mergeColors;

  if (WEB_ANIMATIONS_TESTING) {
    testing.parseColor = parseColor;
  }

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function parseDimension(unitRegExp, string) {
    string = string.trim().toLowerCase();

    if (string == '0' && 'px'.search(unitRegExp) >= 0)
      return {px: 0};

    // If we have parenthesis, we're a calc and need to start with 'calc'.
    if (!/^[^(]*$|^calc/.test(string))
      return;
    string = string.replace(/calc\(/g, '(');

    // We tag units by prefixing them with 'U' (note that we are already
    // lowercase) to prevent problems with types which are substrings of
    // each other (although prefixes may be problematic!)
    var matchedUnits = {};
    string = string.replace(unitRegExp, function(match) {
      matchedUnits[match] = null;
      return 'U' + match;
    });
    var taggedUnitRegExp = 'U(' + unitRegExp.source + ')';

    // Validating input is simply applying as many reductions as we can.
    var typeCheck = string.replace(/[-+]?(\d*\.)?\d+/g, 'N')
        .replace(new RegExp('N' + taggedUnitRegExp, 'g'), 'D')
        .replace(/\s[+-]\s/g, 'O')
        .replace(/\s/g, '');
    var reductions = [/N\*(D)/g, /(N|D)[*/]N/g, /(N|D)O\1/g, /\((N|D)\)/g];
    var i = 0;
    while (i < reductions.length) {
      if (reductions[i].test(typeCheck)) {
        typeCheck = typeCheck.replace(reductions[i], '$1');
        i = 0;
      } else {
        i++;
      }
    }
    if (typeCheck != 'D')
      return;

    for (var unit in matchedUnits) {
      var result = parseFloat(string.replace(new RegExp('U' + unit, 'g'), '').replace(new RegExp(taggedUnitRegExp, 'g'), '*0'));
      if (!isFinite(result))
        return;
      matchedUnits[unit] = result;
    }
    return matchedUnits;
  }

  function mergeDimensionsNonNegative(left, right) {
    return mergeDimensions(left, right, true);
  }

  function mergeDimensions(left, right, nonNegative) {
    var units = [], unit;
    for (unit in left)
      units.push(unit);
    for (unit in right) {
      if (units.indexOf(unit) < 0)
        units.push(unit);
    }

    left = units.map(function(unit) { return left[unit] || 0; });
    right = units.map(function(unit) { return right[unit] || 0; });
    return [left, right, function(values) {
      var result = values.map(function(value, i) {
        if (values.length == 1 && nonNegative) {
          value = Math.max(value, 0);
        }
        // Scientific notation (e.g. 1e2) is not yet widely supported by browser vendors.
        return scope.numberToString(value) + units[i];
      }).join(' + ');
      return values.length > 1 ? 'calc(' + result + ')' : result;
    }];
  }

  var lengthUnits = 'px|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc';
  var parseLength = parseDimension.bind(null, new RegExp(lengthUnits, 'g'));
  var parseLengthOrPercent = parseDimension.bind(null, new RegExp(lengthUnits + '|%', 'g'));
  var parseAngle = parseDimension.bind(null, /deg|rad|grad|turn/g);

  scope.parseLength = parseLength;
  scope.parseLengthOrPercent = parseLengthOrPercent;
  scope.consumeLengthOrPercent = scope.consumeParenthesised.bind(null, parseLengthOrPercent);
  scope.parseAngle = parseAngle;
  scope.mergeDimensions = mergeDimensions;

  var consumeLength = scope.consumeParenthesised.bind(null, parseLength);
  var consumeSizePair = scope.consumeRepeated.bind(undefined, consumeLength, /^/);
  var consumeSizePairList = scope.consumeRepeated.bind(undefined, consumeSizePair, /^,/);
  scope.consumeSizePairList = consumeSizePairList;

  var parseSizePairList = function(input) {
    var result = consumeSizePairList(input);
    if (result && result[1] == '') {
      return result[0];
    }
  };

  var mergeNonNegativeSizePair = scope.mergeNestedRepeated.bind(undefined, mergeDimensionsNonNegative, ' ');
  var mergeNonNegativeSizePairList = scope.mergeNestedRepeated.bind(undefined, mergeNonNegativeSizePair, ',');
  scope.mergeNonNegativeSizePair = mergeNonNegativeSizePair;

  scope.addPropertiesHandler(parseSizePairList, mergeNonNegativeSizePairList, [
    'background-size'
  ]);

  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensionsNonNegative, [
    'border-bottom-width',
    'border-image-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
    'flex-basis',
    'font-size',
    'height',
    'line-height',
    'max-height',
    'max-width',
    'outline-width',
    'width',
  ]);

  scope.addPropertiesHandler(parseLengthOrPercent, mergeDimensions, [
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'bottom',
    'left',
    'letter-spacing',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'margin-top',
    'min-height',
    'min-width',
    'outline-offset',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'perspective',
    'right',
    'shape-margin',
    'stroke-dashoffset',
    'text-indent',
    'top',
    'vertical-align',
    'word-spacing',
  ]);

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {
  function consumeLengthPercentOrAuto(string) {
    return scope.consumeLengthOrPercent(string) || scope.consumeToken(/^auto/, string);
  }
  function parseBox(string) {
    var result = scope.consumeList([
      scope.ignore(scope.consumeToken.bind(null, /^rect/)),
      scope.ignore(scope.consumeToken.bind(null, /^\(/)),
      scope.consumeRepeated.bind(null, consumeLengthPercentOrAuto, /^,/),
      scope.ignore(scope.consumeToken.bind(null, /^\)/)),
    ], string);
    if (result && result[0].length == 4) {
      return result[0];
    }
  }

  function mergeComponent(left, right) {
    if (left == 'auto' || right == 'auto') {
      return [true, false, function(t) {
        var result = t ? left : right;
        if (result == 'auto') {
          return 'auto';
        }
        // FIXME: There's probably a better way to turn a dimension back into a string.
        var merged = scope.mergeDimensions(result, result);
        return merged[2](merged[0]);
      }];
    }
    return scope.mergeDimensions(left, right);
  }

  function wrap(result) {
    return 'rect(' + result + ')';
  }

  var mergeBoxes = scope.mergeWrappedNestedRepeated.bind(null, wrap, mergeComponent, ', ');

  scope.parseBox = parseBox;
  scope.mergeBoxes = mergeBoxes;

  scope.addPropertiesHandler(parseBox, mergeBoxes, ['clip']);

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  // This returns a function for converting transform functions to equivalent
  // primitive functions, which will take an array of values from the
  // derivative type and fill in the blanks (underscores) with them.
  var _ = null;
  function cast(pattern) {
    return function(contents) {
      var i = 0;
      return pattern.map(function(x) { return x === _ ? contents[i++] : x; });
    }
  }

  function id(x) { return x; }

  var Opx = {px: 0};
  var Odeg = {deg: 0};

  // type: [argTypes, convertTo3D, convertTo2D]
  // In the argument types string, lowercase characters represent optional arguments
  var transformFunctions = {
    matrix: ['NNNNNN', [_, _, 0, 0, _, _, 0, 0, 0, 0, 1, 0, _, _, 0, 1], id],
    matrix3d: ['NNNNNNNNNNNNNNNN', id],
    rotate: ['A'],
    rotatex: ['A'],
    rotatey: ['A'],
    rotatez: ['A'],
    rotate3d: ['NNNA'],
    perspective: ['L'],
    scale: ['Nn', cast([_, _, 1]), id],
    scalex: ['N', cast([_, 1, 1]), cast([_, 1])],
    scaley: ['N', cast([1, _, 1]), cast([1, _])],
    scalez: ['N', cast([1, 1, _])],
    scale3d: ['NNN', id],
    skew: ['Aa', null, id],
    skewx: ['A', null, cast([_, Odeg])],
    skewy: ['A', null, cast([Odeg, _])],
    translate: ['Tt', cast([_, _, Opx]), id],
    translatex: ['T', cast([_, Opx, Opx]), cast([_, Opx])],
    translatey: ['T', cast([Opx, _, Opx]), cast([Opx, _])],
    translatez: ['L', cast([Opx, Opx, _])],
    translate3d: ['TTL', id],
  };

  function parseTransform(string) {
    string = string.toLowerCase().trim();
    if (string == 'none')
      return [];
    // FIXME: Using a RegExp means calcs won't work here
    var transformRegExp = /\s*(\w+)\(([^)]*)\)/g;
    var result = [];
    var match;
    var prevLastIndex = 0;
    while (match = transformRegExp.exec(string)) {
      if (match.index != prevLastIndex)
        return;
      prevLastIndex = match.index + match[0].length;
      var functionName = match[1];
      var functionData = transformFunctions[functionName];
      if (!functionData)
        return;
      var args = match[2].split(',');
      var argTypes = functionData[0];
      if (argTypes.length < args.length)
        return;

      var parsedArgs = [];
      for (var i = 0; i < argTypes.length; i++) {
        var arg = args[i];
        var type = argTypes[i];
        var parsedArg;
        if (!arg)
          parsedArg = ({a: Odeg,
                        n: parsedArgs[0],
                        t: Opx})[type];
        else
          parsedArg = ({A: function(s) { return s.trim() == '0' ? Odeg : scope.parseAngle(s); },
                        N: scope.parseNumber,
                        T: scope.parseLengthOrPercent,
                        L: scope.parseLength})[type.toUpperCase()](arg);
        if (parsedArg === undefined)
          return;
        parsedArgs.push(parsedArg);
      }
      result.push({t: functionName, d: parsedArgs});

      if (transformRegExp.lastIndex == string.length)
        return result;
    }
  };

  function numberToLongString(x) {
    return x.toFixed(6).replace('.000000', '');
  }

  function mergeMatrices(left, right) {
    if (left.decompositionPair !== right) {
      left.decompositionPair = right;
      var leftArgs = scope.makeMatrixDecomposition(left);
    }
    if (right.decompositionPair !== left) {
      right.decompositionPair = left;
      var rightArgs = scope.makeMatrixDecomposition(right);
    }
    if (leftArgs[0] == null || rightArgs[0] == null)
      return [[false], [true], function(x) { return x ? right[0].d : left[0].d; }];
    leftArgs[0].push(0);
    rightArgs[0].push(1);
    return [
      leftArgs,
      rightArgs,
      function(list) {
        var quat = scope.quat(leftArgs[0][3], rightArgs[0][3], list[5]);
        var mat = scope.composeMatrix(list[0], list[1], list[2], quat, list[4]);
        var stringifiedArgs = mat.map(numberToLongString).join(',');
        return stringifiedArgs;
      }
    ];
  }

  function typeTo2D(type) {
    return type.replace(/[xy]/, '');
  }

  function typeTo3D(type) {
    return type.replace(/(x|y|z|3d)?$/, '3d');
  }

  function mergeTransforms(left, right) {
    var matrixModulesLoaded = scope.makeMatrixDecomposition && true;

    var flipResults = false;
    if (!left.length || !right.length) {
      if (!left.length) {
        flipResults = true;
        left = right;
        right = [];
      }
      for (var i = 0; i < left.length; i++) {
        var type = left[i].t;
        var args = left[i].d;
        var defaultValue = type.substr(0, 5) == 'scale' ? 1 : 0;
        right.push({t: type, d: args.map(function(arg) {
          if (typeof arg == 'number')
            return defaultValue;
          var result = {};
          for (var unit in arg)
            result[unit] = defaultValue;
          return result;
        })});
      }
    }

    var isMatrixOrPerspective = function(lt, rt) {
      return ((lt == 'perspective') && (rt == 'perspective')) ||
          ((lt == 'matrix' || lt == 'matrix3d') && (rt == 'matrix' || rt == 'matrix3d'));
    };
    var leftResult = [];
    var rightResult = [];
    var types = [];

    if (left.length != right.length) {
      if (!matrixModulesLoaded)
        return;
      var merged = mergeMatrices(left, right);
      leftResult = [merged[0]];
      rightResult = [merged[1]];
      types = [['matrix', [merged[2]]]];
    } else {
      for (var i = 0; i < left.length; i++) {
        var leftType = left[i].t;
        var rightType = right[i].t;
        var leftArgs = left[i].d;
        var rightArgs = right[i].d;

        var leftFunctionData = transformFunctions[leftType];
        var rightFunctionData = transformFunctions[rightType];

        var type;
        if (isMatrixOrPerspective(leftType, rightType)) {
          if (!matrixModulesLoaded)
            return;
          var merged = mergeMatrices([left[i]], [right[i]]);
          leftResult.push(merged[0]);
          rightResult.push(merged[1]);
          types.push(['matrix', [merged[2]]]);
          continue;
        } else if (leftType == rightType) {
          type = leftType;
        } else if (leftFunctionData[2] && rightFunctionData[2] && typeTo2D(leftType) == typeTo2D(rightType)) {
          type = typeTo2D(leftType);
          leftArgs = leftFunctionData[2](leftArgs);
          rightArgs = rightFunctionData[2](rightArgs);
        } else if (leftFunctionData[1] && rightFunctionData[1] && typeTo3D(leftType) == typeTo3D(rightType)) {
          type = typeTo3D(leftType);
          leftArgs = leftFunctionData[1](leftArgs);
          rightArgs = rightFunctionData[1](rightArgs);
        } else {
          if (!matrixModulesLoaded)
            return;
          var merged = mergeMatrices(left, right);
          leftResult = [merged[0]];
          rightResult = [merged[1]];
          types = [['matrix', [merged[2]]]];
          break;
        }

        var leftArgsCopy = [];
        var rightArgsCopy = [];
        var stringConversions = [];
        for (var j = 0; j < leftArgs.length; j++) {
          var merge = typeof leftArgs[j] == 'number' ? scope.mergeNumbers : scope.mergeDimensions;
          var merged = merge(leftArgs[j], rightArgs[j]);
          leftArgsCopy[j] = merged[0];
          rightArgsCopy[j] = merged[1];
          stringConversions.push(merged[2]);
        }
        leftResult.push(leftArgsCopy);
        rightResult.push(rightArgsCopy);
        types.push([type, stringConversions]);
      }
    }

    if (flipResults) {
      var tmp = leftResult;
      leftResult = rightResult;
      rightResult = tmp;
    }

    return [leftResult, rightResult, function(list) {
      return list.map(function(args, i) {
        var stringifiedArgs = args.map(function(arg, j) {
          return types[i][1][j](arg);
        }).join(',');
        if (types[i][0] == 'matrix' && stringifiedArgs.split(',').length == 16)
          types[i][0] = 'matrix3d';
        return types[i][0] + '(' + stringifiedArgs + ')';

      }).join(' ');
    }];
  }

  scope.addPropertiesHandler(parseTransform, mergeTransforms, ['transform']);

  if (WEB_ANIMATIONS_TESTING)
    testing.parseTransform = parseTransform;

})(webAnimations1, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {
  function parse(string) {
    var out = Number(string);
    if (isNaN(out) || out < 100 || out > 900 || out % 100 !== 0) {
      return;
    }
    return out;
  }

  function toCss(value) {
    value = Math.round(value / 100) * 100;
    value = scope.clamp(100, 900, value);
    if (value === 400) {
      return 'normal';
    }
    if (value === 700) {
      return 'bold';
    }
    return String(value);
  }

  function merge(left, right) {
    return [left, right, toCss];
  }

  scope.addPropertiesHandler(parse, merge, ['font-weight']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  function negateDimension(dimension) {
    var result = {};
    for (var k in dimension) {
      result[k] = -dimension[k];
    }
    return result;
  }

  function consumeOffset(string) {
    return scope.consumeToken(/^(left|center|right|top|bottom)\b/i, string) || scope.consumeLengthOrPercent(string);
  }

  var offsetMap = {
    left: {'%': 0},
    center: {'%': 50},
    right: {'%': 100},
    top: {'%': 0},
    bottom: {'%': 100},
  };

  function parseOrigin(slots, string) {
    var result = scope.consumeRepeated(consumeOffset, /^/, string);
    if (!result || result[1] != '') return;
    var tokens = result[0];
    tokens[0] = tokens[0] || 'center';
    tokens[1] = tokens[1] || 'center';
    if (slots == 3) {
      tokens[2] = tokens[2] || {px: 0};
    }
    if (tokens.length != slots) {
      return;
    }
    // Reorder so that the horizontal axis comes first.
    if (/top|bottom/.test(tokens[0]) || /left|right/.test(tokens[1])) {
      var tmp = tokens[0];
      tokens[0] = tokens[1];
      tokens[1] = tmp;
    }
    // Invalid if not horizontal then vertical.
    if (!/left|right|center|Object/.test(tokens[0]))
      return;
    if (!/top|bottom|center|Object/.test(tokens[1]))
      return;
    return tokens.map(function(position) {
      return typeof position == 'object' ? position : offsetMap[position];
    });
  }

  var mergeOffsetList = scope.mergeNestedRepeated.bind(null, scope.mergeDimensions, ' ');
  scope.addPropertiesHandler(parseOrigin.bind(null, 3), mergeOffsetList, ['transform-origin']);
  scope.addPropertiesHandler(parseOrigin.bind(null, 2), mergeOffsetList, ['perspective-origin']);

  function consumePosition(string) {
    var result = scope.consumeRepeated(consumeOffset, /^/, string);
    if (!result) {
      return;
    }

    var tokens = result[0];
    var out = [{'%': 50}, {'%': 50}];
    var pos = 0;
    var bottomOrRight = false;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token == 'string') {
        bottomOrRight = /bottom|right/.test(token);
        pos = {left: 0, right: 0, center: pos, top: 1, bottom: 1}[token];
        out[pos] = offsetMap[token];
        if (token == 'center') {
          // Center doesn't accept a length offset.
          pos++;
        }
      } else {
        if (bottomOrRight) {
          // If bottom or right we need to subtract the length from 100%
          token = negateDimension(token);
          token['%'] = (token['%'] || 0) + 100;
        }
        out[pos] = token;
        pos++;
        bottomOrRight = false;
      }
    }
    return [out, result[1]];
  }

  function parsePositionList(string) {
    var result = scope.consumeRepeated(consumePosition, /^,/, string);
    if (result && result[1] == '') {
      return result[0];
    }
  }

  scope.consumePosition = consumePosition;
  scope.mergeOffsetList = mergeOffsetList;

  var mergePositionList = scope.mergeNestedRepeated.bind(null, mergeOffsetList, ', ');
  scope.addPropertiesHandler(parsePositionList, mergePositionList, ['background-position', 'object-position']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  var consumeLengthOrPercent = scope.consumeParenthesised.bind(null, scope.parseLengthOrPercent);
  var consumeLengthOrPercentPair = scope.consumeRepeated.bind(undefined, consumeLengthOrPercent, /^/);

  var mergeSizePair = scope.mergeNestedRepeated.bind(undefined, scope.mergeDimensions, ' ');
  var mergeSizePairList = scope.mergeNestedRepeated.bind(undefined, mergeSizePair, ',');

  function parseShape(input) {
    var circle = scope.consumeToken(/^circle/, input);
    if (circle && circle[0]) {
      return ['circle'].concat(scope.consumeList([
        scope.ignore(scope.consumeToken.bind(undefined, /^\(/)),
        consumeLengthOrPercent,
        scope.ignore(scope.consumeToken.bind(undefined, /^at/)),
        scope.consumePosition,
        scope.ignore(scope.consumeToken.bind(undefined, /^\)/))
      ], circle[1]));
    }
    var ellipse = scope.consumeToken(/^ellipse/, input);
    if (ellipse && ellipse[0]) {
      return ['ellipse'].concat(scope.consumeList([
        scope.ignore(scope.consumeToken.bind(undefined, /^\(/)),
        consumeLengthOrPercentPair,
        scope.ignore(scope.consumeToken.bind(undefined, /^at/)),
        scope.consumePosition,
        scope.ignore(scope.consumeToken.bind(undefined, /^\)/))
      ], ellipse[1]));
    }
    var polygon = scope.consumeToken(/^polygon/, input);
    if (polygon && polygon[0]) {
      return ['polygon'].concat(scope.consumeList([
        scope.ignore(scope.consumeToken.bind(undefined, /^\(/)),
        scope.optional(scope.consumeToken.bind(undefined, /^nonzero\s*,|^evenodd\s*,/), 'nonzero,'),
        scope.consumeSizePairList,
        scope.ignore(scope.consumeToken.bind(undefined, /^\)/))
      ], polygon[1]));
    }
  }

  function mergeShapes(left, right) {
    if (left[0] !== right[0])
      return;
    if (left[0] == 'circle') {
      return scope.mergeList(left.slice(1), right.slice(1), [
        'circle(',
        scope.mergeDimensions,
        ' at ',
        scope.mergeOffsetList,
        ')']);
    }
    if (left[0] == 'ellipse') {
      return scope.mergeList(left.slice(1), right.slice(1), [
        'ellipse(',
        scope.mergeNonNegativeSizePair,
        ' at ',
        scope.mergeOffsetList,
        ')']);
    }
    if (left[0] == 'polygon' && left[1] == right[1]) {
      return scope.mergeList(left.slice(2), right.slice(2), [
        'polygon(',
        left[1],
        mergeSizePairList,
        ')']);
    }
  }

  scope.addPropertiesHandler(parseShape, mergeShapes, ['shape-outside']);

})(webAnimations1);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  var aliased = {};

  function alias(name, aliases) {
    aliases.concat([name]).forEach(function(candidate) {
      if (candidate in document.documentElement.style) {
        aliased[name] = candidate;
      }
    });
  }
  alias('transform', ['webkitTransform', 'msTransform']);
  alias('transformOrigin', ['webkitTransformOrigin']);
  alias('perspective', ['webkitPerspective']);
  alias('perspectiveOrigin', ['webkitPerspectiveOrigin']);

  scope.propertyName = function(property) {
    return aliased[property] || property;
  };

})(webAnimations1, webAnimationsTesting);
// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function() {

  if (document.createElement('div').animate([]).oncancel !== undefined) {
    return;
  }

  if (WEB_ANIMATIONS_TESTING) {
    var now = function() { return webAnimations1.timeline.currentTime; };
  } else if (window.performance && performance.now) {
    var now = function() { return performance.now(); };
  } else {
    var now = function() { return Date.now(); };
  }

  var AnimationCancelEvent = function(target, currentTime, timelineTime) {
    this.target = target;
    this.currentTime = currentTime;
    this.timelineTime = timelineTime;

    this.type = 'cancel';
    this.bubbles = false;
    this.cancelable = false;
    this.currentTarget = target;
    this.defaultPrevented = false;
    this.eventPhase = Event.AT_TARGET;
    this.timeStamp = Date.now();
  };

  var originalElementAnimate = window.Element.prototype.animate;
  window.Element.prototype.animate = function(effectInput, options) {
    var animation = originalElementAnimate.call(this, effectInput, options);

    animation._cancelHandlers = [];
    animation.oncancel = null;

    var originalCancel = animation.cancel;
    animation.cancel = function() {
      originalCancel.call(this);
      var event = new AnimationCancelEvent(this, null, now());
      var handlers = this._cancelHandlers.concat(this.oncancel ? [this.oncancel] : []);
      setTimeout(function() {
        handlers.forEach(function(handler) {
          handler.call(event.target, event);
        });
      }, 0);
    };

    var originalAddEventListener = animation.addEventListener;
    animation.addEventListener = function(type, handler) {
      if (typeof handler == 'function' && type == 'cancel')
        this._cancelHandlers.push(handler);
      else
        originalAddEventListener.call(this, type, handler);
    };

    var originalRemoveEventListener = animation.removeEventListener;
    animation.removeEventListener = function(type, handler) {
      if (type == 'cancel') {
        var index = this._cancelHandlers.indexOf(handler);
        if (index >= 0)
          this._cancelHandlers.splice(index, 1);
      } else {
        originalRemoveEventListener.call(this, type, handler);
      }
    };

    return animation;
  };
})();
// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared) {
  // If the polyfill is being loaded in a context where Element.animate is
  // supported but object-form syntax is not, then creating an animation
  // using the new syntax will either have no effect or will throw an exception.
  // In either case, we want to proceed to load this part of the polyfill.
  //
  // The test animation uses an opacity other than the one the element already
  // has, and doesn't need to change during the animation for the test to work.
  // After the test, the element's opacity will be left how we found it:
  // - If the animation is not created, the test will leave the element's
  //   opacity untouched at originalOpacity.
  // - If the animation is created, it will be cancelled, and leave the
  //   element's opacity at originalOpacity.
  // - If the animation is somehow created and runs without being cancelled,
  //   when it finishes after 1ms, it will cease to have any effect (because
  //   fill is not specified), and opacity will again be left at originalOpacity.
  var element = document.documentElement;
  var animation = null;
  var animated = false;
  try {
    var originalOpacity = getComputedStyle(element).getPropertyValue('opacity');
    var testOpacity = originalOpacity == '0' ? '1' : '0';
    animation = element.animate({'opacity': [testOpacity, testOpacity]},
        {duration: 1});
    animation.currentTime = 0;
    animated = getComputedStyle(element).getPropertyValue('opacity') == testOpacity;
  } catch (error) {
  } finally {
    if (animation)
      animation.cancel();
  }
  if (animated) {
    return;
  }

  var originalElementAnimate = window.Element.prototype.animate;
  window.Element.prototype.animate = function(effectInput, options) {
    if (window.Symbol && Symbol.iterator && Array.prototype.from && effectInput[Symbol.iterator]) {
      // Handle custom iterables in most browsers by converting to an array
      effectInput = Array.from(effectInput);
    }

    if (!Array.isArray(effectInput) && effectInput !== null) {
      effectInput = shared.convertToArrayForm(effectInput);
    }

    return originalElementAnimate.call(this, effectInput, options);
  };
})(webAnimationsShared);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.


(function(shared, scope, testing) {
  var originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(f) {
    return originalRequestAnimationFrame(function(x) {
      scope.timeline._updateAnimationsPromises();
      f(x);
      scope.timeline._updateAnimationsPromises();
    });
  };

  scope.AnimationTimeline = function() {
    this._animations = [];
    this.currentTime = undefined;
  };

  scope.AnimationTimeline.prototype = {
    getAnimations: function() {
      this._discardAnimations();
      return this._animations.slice();
    },
    _updateAnimationsPromises: function() {
      scope.animationsWithPromises = scope.animationsWithPromises.filter(function(animation) {
        return animation._updatePromises();
      });
    },
    _discardAnimations: function() {
      this._updateAnimationsPromises();
      this._animations = this._animations.filter(function(animation) {
        return animation.playState != 'finished' && animation.playState != 'idle';
      });
    },
    _play: function(effect) {
      var animation = new scope.Animation(effect, this);
      this._animations.push(animation);
      scope.restartWebAnimationsNextTick();
      // Use animation._animation.play() here, NOT animation.play().
      //
      // Timeline.play calls new scope.Animation(effect) which (indirectly) calls Timeline.play on
      // effect's children, and Animation.play is also recursive. We only need to call play on each
      // animation in the tree once.
      animation._updatePromises();
      animation._animation.play();
      animation._updatePromises();
      return animation;
    },
    play: function(effect) {
      if (effect) {
        effect.remove();
      }
      return this._play(effect);
    }
  };

  var ticking = false;

  scope.restartWebAnimationsNextTick = function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(webAnimationsNextTick);
    }
  };

  function webAnimationsNextTick(t) {
    var timeline = scope.timeline;
    timeline.currentTime = t;
    timeline._discardAnimations();
    if (timeline._animations.length == 0)
      ticking = false;
    else
      requestAnimationFrame(webAnimationsNextTick);
  }

  var timeline = new scope.AnimationTimeline();
  scope.timeline = timeline;

  try {
    Object.defineProperty(window.document, 'timeline', {
      configurable: true,
      get: function() { return timeline; }
    });
  } catch (e) { }
  try {
    window.document.timeline = timeline;
  } catch (e) { }

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {
  scope.animationsWithPromises = [];

  scope.Animation = function(effect, timeline) {
    this.id = '';
    if (effect && effect._id) {
      this.id = effect._id;
    }
    this.effect = effect;
    if (effect) {
      effect._animation = this;
    }
    if (!timeline) {
      throw new Error('Animation with null timeline is not supported');
    }
    this._timeline = timeline;
    this._sequenceNumber = shared.sequenceNumber++;
    this._holdTime = 0;
    this._paused = false;
    this._isGroup = false;
    this._animation = null;
    this._childAnimations = [];
    this._callback = null;
    this._oldPlayState = 'idle';
    this._rebuildUnderlyingAnimation();
    // Animations are constructed in the idle state.
    this._animation.cancel();
    this._updatePromises();
  };

  scope.Animation.prototype = {
    _updatePromises: function() {
      var oldPlayState = this._oldPlayState;
      var newPlayState = this.playState;
      if (this._readyPromise && newPlayState !== oldPlayState) {
        if (newPlayState == 'idle') {
          this._rejectReadyPromise();
          this._readyPromise = undefined;
        } else if (oldPlayState == 'pending') {
          this._resolveReadyPromise();
        } else if (newPlayState == 'pending') {
          this._readyPromise = undefined;
        }
      }
      if (this._finishedPromise && newPlayState !== oldPlayState) {
        if (newPlayState == 'idle') {
          this._rejectFinishedPromise();
          this._finishedPromise = undefined;
        } else if (newPlayState == 'finished') {
          this._resolveFinishedPromise();
        } else if (oldPlayState == 'finished') {
          this._finishedPromise = undefined;
        }
      }
      this._oldPlayState = this.playState;
      return (this._readyPromise || this._finishedPromise);
    },
    _rebuildUnderlyingAnimation: function() {
      this._updatePromises();
      var oldPlaybackRate;
      var oldPaused;
      var oldStartTime;
      var oldCurrentTime;
      var hadUnderlying = this._animation ? true : false;
      if (hadUnderlying) {
        oldPlaybackRate = this.playbackRate;
        oldPaused = this._paused;
        oldStartTime = this.startTime;
        oldCurrentTime = this.currentTime;
        this._animation.cancel();
        this._animation._wrapper = null;
        this._animation = null;
      }

      if (!this.effect || this.effect instanceof window.KeyframeEffect) {
        this._animation = scope.newUnderlyingAnimationForKeyframeEffect(this.effect);
        scope.bindAnimationForKeyframeEffect(this);
      }
      if (this.effect instanceof window.SequenceEffect || this.effect instanceof window.GroupEffect) {
        this._animation = scope.newUnderlyingAnimationForGroup(this.effect);
        scope.bindAnimationForGroup(this);
      }
      if (this.effect && this.effect._onsample) {
        scope.bindAnimationForCustomEffect(this);
      }
      if (hadUnderlying) {
        if (oldPlaybackRate != 1) {
          this.playbackRate = oldPlaybackRate;
        }
        if (oldStartTime !== null) {
          this.startTime = oldStartTime;
        } else if (oldCurrentTime !== null) {
          this.currentTime = oldCurrentTime;
        } else if (this._holdTime !== null) {
          this.currentTime = this._holdTime;
        }
        if (oldPaused) {
          this.pause();
        }
      }
      this._updatePromises();
    },
    _updateChildren: function() {
      if (!this.effect || this.playState == 'idle')
        return;

      var offset = this.effect._timing.delay;
      this._childAnimations.forEach(function(childAnimation) {
        this._arrangeChildren(childAnimation, offset);
        if (this.effect instanceof window.SequenceEffect)
          offset += scope.groupChildDuration(childAnimation.effect);
      }.bind(this));
    },
    _setExternalAnimation: function(animation) {
      if (!this.effect || !this._isGroup)
        return;
      for (var i = 0; i < this.effect.children.length; i++) {
        this.effect.children[i]._animation = animation;
        this._childAnimations[i]._setExternalAnimation(animation);
      }
    },
    _constructChildAnimations: function() {
      if (!this.effect || !this._isGroup)
        return;
      var offset = this.effect._timing.delay;
      this._removeChildAnimations();
      this.effect.children.forEach(function(child) {
        var childAnimation = scope.timeline._play(child);
        this._childAnimations.push(childAnimation);
        childAnimation.playbackRate = this.playbackRate;
        if (this._paused)
          childAnimation.pause();
        child._animation = this.effect._animation;

        this._arrangeChildren(childAnimation, offset);

        if (this.effect instanceof window.SequenceEffect)
          offset += scope.groupChildDuration(child);
      }.bind(this));
    },
    _arrangeChildren: function(childAnimation, offset) {
      if (this.startTime === null) {
        childAnimation.currentTime = this.currentTime - offset / this.playbackRate;
      } else if (childAnimation.startTime !== this.startTime + offset / this.playbackRate) {
        childAnimation.startTime = this.startTime + offset / this.playbackRate;
      }
    },
    get timeline() {
      return this._timeline;
    },
    get playState() {
      return this._animation ? this._animation.playState : 'idle';
    },
    get finished() {
      if (!window.Promise) {
        console.warn('Animation Promises require JavaScript Promise constructor');
        return null;
      }
      if (!this._finishedPromise) {
        if (scope.animationsWithPromises.indexOf(this) == -1) {
          scope.animationsWithPromises.push(this);
        }
        this._finishedPromise = new Promise(
            function(resolve, reject) {
              this._resolveFinishedPromise = function() {
                resolve(this);
              };
              this._rejectFinishedPromise = function() {
                reject({type: DOMException.ABORT_ERR, name: 'AbortError'});
              };
            }.bind(this));
        if (this.playState == 'finished') {
          this._resolveFinishedPromise();
        }
      }
      return this._finishedPromise;
    },
    get ready() {
      if (!window.Promise) {
        console.warn('Animation Promises require JavaScript Promise constructor');
        return null;
      }
      if (!this._readyPromise) {
        if (scope.animationsWithPromises.indexOf(this) == -1) {
          scope.animationsWithPromises.push(this);
        }
        this._readyPromise = new Promise(
            function(resolve, reject) {
              this._resolveReadyPromise = function() {
                resolve(this);
              };
              this._rejectReadyPromise = function() {
                reject({type: DOMException.ABORT_ERR, name: 'AbortError'});
              };
            }.bind(this));
        if (this.playState !== 'pending') {
          this._resolveReadyPromise();
        }
      }
      return this._readyPromise;
    },
    get onfinish() {
      return this._animation.onfinish;
    },
    set onfinish(v) {
      if (typeof v == 'function') {
        this._animation.onfinish = (function(e) {
          e.target = this;
          v.call(this, e);
        }).bind(this);
      } else {
        this._animation.onfinish = v;
      }
    },
    get oncancel() {
      return this._animation.oncancel;
    },
    set oncancel(v) {
      if (typeof v == 'function') {
        this._animation.oncancel = (function(e) {
          e.target = this;
          v.call(this, e);
        }).bind(this);
      } else {
        this._animation.oncancel = v;
      }
    },
    get currentTime() {
      this._updatePromises();
      var currentTime = this._animation.currentTime;
      this._updatePromises();
      return currentTime;
    },
    set currentTime(v) {
      this._updatePromises();
      this._animation.currentTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.currentTime = v - offset;
      });
      this._updatePromises();
    },
    get startTime() {
      return this._animation.startTime;
    },
    set startTime(v) {
      this._updatePromises();
      this._animation.startTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.startTime = v + offset;
      });
      this._updatePromises();
    },
    get playbackRate() {
      return this._animation.playbackRate;
    },
    set playbackRate(value) {
      this._updatePromises();
      var oldCurrentTime = this.currentTime;
      this._animation.playbackRate = value;
      this._forEachChild(function(childAnimation) {
        childAnimation.playbackRate = value;
      });
      if (oldCurrentTime !== null) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    play: function() {
      this._updatePromises();
      this._paused = false;
      this._animation.play();
      if (this._timeline._animations.indexOf(this) == -1) {
        this._timeline._animations.push(this);
      }
      this._register();
      scope.awaitStartTime(this);
      this._forEachChild(function(child) {
        var time = child.currentTime;
        child.play();
        child.currentTime = time;
      });
      this._updatePromises();
    },
    pause: function() {
      this._updatePromises();
      if (this.currentTime) {
        this._holdTime = this.currentTime;
      }
      this._animation.pause();
      this._register();
      this._forEachChild(function(child) {
        child.pause();
      });
      this._paused = true;
      this._updatePromises();
    },
    finish: function() {
      this._updatePromises();
      this._animation.finish();
      this._register();
      this._updatePromises();
    },
    cancel: function() {
      this._updatePromises();
      this._animation.cancel();
      this._register();
      this._removeChildAnimations();
      this._updatePromises();
    },
    reverse: function() {
      this._updatePromises();
      var oldCurrentTime = this.currentTime;
      this._animation.reverse();
      this._forEachChild(function(childAnimation) {
        childAnimation.reverse();
      });
      if (oldCurrentTime !== null) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    addEventListener: function(type, handler) {
      var wrapped = handler;
      if (typeof handler == 'function') {
        wrapped = (function(e) {
          e.target = this;
          handler.call(this, e);
        }).bind(this);
        handler._wrapper = wrapped;
      }
      this._animation.addEventListener(type, wrapped);
    },
    removeEventListener: function(type, handler) {
      this._animation.removeEventListener(type, (handler && handler._wrapper) || handler);
    },
    _removeChildAnimations: function() {
      while (this._childAnimations.length)
        this._childAnimations.pop().cancel();
    },
    _forEachChild: function(f) {
      var offset = 0;
      if (this.effect.children && this._childAnimations.length < this.effect.children.length)
        this._constructChildAnimations();
      this._childAnimations.forEach(function(child) {
        f.call(this, child, offset);
        if (this.effect instanceof window.SequenceEffect)
          offset += child.effect.activeDuration;
      }.bind(this));

      if (this.playState == 'pending')
        return;
      var timing = this.effect._timing;
      var t = this.currentTime;
      if (t !== null)
        t = shared.calculateIterationProgress(shared.calculateActiveDuration(timing), t, timing);
      if (t == null || isNaN(t))
        this._removeChildAnimations();
    },
  };

  window.Animation = scope.Animation;

  if (WEB_ANIMATIONS_TESTING) {
    testing.webAnimationsNextAnimation = scope.Animation;
  }

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  var disassociate = function(effect) {
    effect._animation = undefined;
    if (effect instanceof window.SequenceEffect || effect instanceof window.GroupEffect) {
      for (var i = 0; i < effect.children.length; i++) {
        disassociate(effect.children[i]);
      }
    }
  };

  scope.removeMulti = function(effects) {
    var oldParents = [];
    for (var i = 0; i < effects.length; i++) {
      var effect = effects[i];
      if (effect._parent) {
        if (oldParents.indexOf(effect._parent) == -1) {
          oldParents.push(effect._parent);
        }
        effect._parent.children.splice(effect._parent.children.indexOf(effect), 1);
        effect._parent = null;
        disassociate(effect);
      } else if (effect._animation && (effect._animation.effect == effect)) {
        effect._animation.cancel();
        effect._animation.effect = new KeyframeEffect(null, []);
        if (effect._animation._callback) {
          effect._animation._callback._animation = null;
        }
        effect._animation._rebuildUnderlyingAnimation();
        disassociate(effect);
      }
    }
    for (i = 0; i < oldParents.length; i++) {
      oldParents[i]._rebuild();
    }
  };

  function KeyframeList(effectInput) {
    this._frames = shared.normalizeKeyframes(effectInput);
  }

  scope.KeyframeEffect = function(target, effectInput, timingInput, id) {
    this.target = target;
    this._parent = null;

    timingInput = shared.numericTimingToObject(timingInput);
    this._timingInput = shared.cloneTimingInput(timingInput);
    this._timing = shared.normalizeTimingInput(timingInput);

    this.timing = shared.makeTiming(timingInput, false, this);
    this.timing._effect = this;
    if (typeof effectInput == 'function') {
      shared.deprecated('Custom KeyframeEffect', '2015-06-22', 'Use KeyframeEffect.onsample instead.');
      this._normalizedKeyframes = effectInput;
    } else {
      this._normalizedKeyframes = new KeyframeList(effectInput);
    }
    this._keyframes = effectInput;
    this.activeDuration = shared.calculateActiveDuration(this._timing);
    this._id = id;
    return this;
  };

  scope.KeyframeEffect.prototype = {
    getFrames: function() {
      if (typeof this._normalizedKeyframes == 'function')
        return this._normalizedKeyframes;
      return this._normalizedKeyframes._frames;
    },
    set onsample(callback) {
      if (typeof this.getFrames() == 'function') {
        throw new Error('Setting onsample on custom effect KeyframeEffect is not supported.');
      }
      this._onsample = callback;
      if (this._animation) {
        this._animation._rebuildUnderlyingAnimation();
      }
    },
    get parent() {
      return this._parent;
    },
    clone: function() {
      if (typeof this.getFrames() == 'function') {
        throw new Error('Cloning custom effects is not supported.');
      }
      var clone = new KeyframeEffect(this.target, [], shared.cloneTimingInput(this._timingInput), this._id);
      clone._normalizedKeyframes = this._normalizedKeyframes;
      clone._keyframes = this._keyframes;
      return clone;
    },
    remove: function() {
      scope.removeMulti([this]);
    }
  };

  var originalElementAnimate = Element.prototype.animate;
  Element.prototype.animate = function(effectInput, options) {
    var id = '';
    if (options && options.id) {
      id = options.id;
    }
    return scope.timeline._play(new scope.KeyframeEffect(this, effectInput, options, id));
  };

  var nullTarget = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
  scope.newUnderlyingAnimationForKeyframeEffect = function(keyframeEffect) {
    if (keyframeEffect) {
      var target = keyframeEffect.target || nullTarget;
      var keyframes = keyframeEffect._keyframes;
      if (typeof keyframes == 'function') {
        keyframes = [];
      }
      var options = keyframeEffect._timingInput;
      options.id = keyframeEffect._id;
    } else {
      var target = nullTarget;
      var keyframes = [];
      var options = 0;
    }
    return originalElementAnimate.apply(target, [keyframes, options]);
  };

  // TODO: Remove this once we remove support for custom KeyframeEffects.
  scope.bindAnimationForKeyframeEffect = function(animation) {
    if (animation.effect && typeof animation.effect._normalizedKeyframes == 'function') {
      scope.bindAnimationForCustomEffect(animation);
    }
  };

  var pendingGroups = [];
  scope.awaitStartTime = function(groupAnimation) {
    if (groupAnimation.startTime !== null || !groupAnimation._isGroup)
      return;
    if (pendingGroups.length == 0) {
      requestAnimationFrame(updatePendingGroups);
    }
    pendingGroups.push(groupAnimation);
  };
  function updatePendingGroups() {
    var updated = false;
    while (pendingGroups.length) {
      var group = pendingGroups.shift();
      group._updateChildren();
      updated = true;
    }
    return updated;
  }
  var originalGetComputedStyle = window.getComputedStyle;
  Object.defineProperty(window, 'getComputedStyle', {
    configurable: true,
    enumerable: true,
    value: function() {
      scope.timeline._updateAnimationsPromises();
      var result = originalGetComputedStyle.apply(this, arguments);
      if (updatePendingGroups())
        result = originalGetComputedStyle.apply(this, arguments);
      scope.timeline._updateAnimationsPromises();
      return result;
    },
  });

  window.KeyframeEffect = scope.KeyframeEffect;
  window.Element.prototype.getAnimations = function() {
    return document.timeline.getAnimations().filter(function(animation) {
      return animation.effect !== null && animation.effect.target == this;
    }.bind(this));
  };

}(webAnimationsShared, webAnimationsNext, webAnimationsTesting));
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.
(function(shared, scope, testing) {

  var nullTarget = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');

  var sequenceNumber = 0;
  scope.bindAnimationForCustomEffect = function(animation) {
    var target = animation.effect.target;
    var effectFunction;
    var isKeyframeEffect = typeof animation.effect.getFrames() == 'function';
    if (isKeyframeEffect) {
      effectFunction = animation.effect.getFrames();
    } else {
      effectFunction = animation.effect._onsample;
    }
    var timing = animation.effect.timing;
    var last = null;
    timing = shared.normalizeTimingInput(timing);
    var callback = function() {
      var t = callback._animation ? callback._animation.currentTime : null;
      if (t !== null) {
        t = shared.calculateIterationProgress(shared.calculateActiveDuration(timing), t, timing);
        if (isNaN(t))
          t = null;
      }
      // FIXME: There are actually more conditions under which the effectFunction
      // should be called.
      if (t !== last) {
        if (isKeyframeEffect) {
          effectFunction(t, target, animation.effect);
        } else {
          effectFunction(t, animation.effect, animation.effect._animation);
        }
      }
      last = t;
    };

    callback._animation = animation;
    callback._registered = false;
    callback._sequenceNumber = sequenceNumber++;
    animation._callback = callback;
    register(callback);
  };

  var callbacks = [];
  var ticking = false;
  function register(callback) {
    if (callback._registered)
      return;
    callback._registered = true;
    callbacks.push(callback);
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }

  function tick(t) {
    var updating = callbacks;
    callbacks = [];
    updating.sort(function(left, right) {
      return left._sequenceNumber - right._sequenceNumber;
    });
    updating = updating.filter(function(callback) {
      callback();
      var playState = callback._animation ? callback._animation.playState : 'idle';
      if (playState != 'running' && playState != 'pending')
        callback._registered = false;
      return callback._registered;
    });
    callbacks.push.apply(callbacks, updating);

    if (callbacks.length) {
      ticking = true;
      requestAnimationFrame(tick);
    } else {
      ticking = false;
    }
  }

  scope.Animation.prototype._register = function() {
    if (this._callback)
      register(this._callback);
  };

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(shared, scope, testing) {

  function groupChildDuration(node) {
    return node._timing.delay + node.activeDuration + node._timing.endDelay;
  }

  function constructor(children, timingInput, id) {
    this._id = id;
    this._parent = null;
    this.children = children || [];
    this._reparent(this.children);
    timingInput = shared.numericTimingToObject(timingInput);
    this._timingInput = shared.cloneTimingInput(timingInput);
    this._timing = shared.normalizeTimingInput(timingInput, true);
    this.timing = shared.makeTiming(timingInput, true, this);
    this.timing._effect = this;

    if (this._timing.duration === 'auto') {
      this._timing.duration = this.activeDuration;
    }
  }

  window.SequenceEffect = function() {
    constructor.apply(this, arguments);
  };

  window.GroupEffect = function() {
    constructor.apply(this, arguments);
  };

  constructor.prototype = {
    _isAncestor: function(effect) {
      var a = this;
      while (a !== null) {
        if (a == effect)
          return true;
        a = a._parent;
      }
      return false;
    },
    _rebuild: function() {
      // Re-calculate durations for ancestors with specified duration 'auto'.
      var node = this;
      while (node) {
        if (node.timing.duration === 'auto') {
          node._timing.duration = node.activeDuration;
        }
        node = node._parent;
      }
      if (this._animation) {
        this._animation._rebuildUnderlyingAnimation();
      }
    },
    _reparent: function(newChildren) {
      scope.removeMulti(newChildren);
      for (var i = 0; i < newChildren.length; i++) {
        newChildren[i]._parent = this;
      }
    },
    _putChild: function(args, isAppend) {
      var message = isAppend ? 'Cannot append an ancestor or self' : 'Cannot prepend an ancestor or self';
      for (var i = 0; i < args.length; i++) {
        if (this._isAncestor(args[i])) {
          throw {
            type: DOMException.HIERARCHY_REQUEST_ERR,
            name: 'HierarchyRequestError',
            message: message
          };
        }
      }
      var oldParents = [];
      for (var i = 0; i < args.length; i++) {
        isAppend ? this.children.push(args[i]) : this.children.unshift(args[i]);
      }
      this._reparent(args);
      this._rebuild();
    },
    append: function()  {
      this._putChild(arguments, true);
    },
    prepend: function()  {
      this._putChild(arguments, false);
    },
    get parent() {
      return this._parent;
    },
    get firstChild() {
      return this.children.length ? this.children[0] : null;
    },
    get lastChild() {
      return this.children.length ? this.children[this.children.length - 1] : null;
    },
    clone: function() {
      var clonedTiming = shared.cloneTimingInput(this._timingInput);
      var clonedChildren = [];
      for (var i = 0; i < this.children.length; i++) {
        clonedChildren.push(this.children[i].clone());
      }
      return (this instanceof GroupEffect) ?
          new GroupEffect(clonedChildren, clonedTiming) :
          new SequenceEffect(clonedChildren, clonedTiming);
    },
    remove: function() {
      scope.removeMulti([this]);
    }
  };

  window.SequenceEffect.prototype = Object.create(constructor.prototype);
  Object.defineProperty(
      window.SequenceEffect.prototype,
      'activeDuration',
      {
        get: function() {
          var total = 0;
          this.children.forEach(function(child) {
            total += groupChildDuration(child);
          });
          return Math.max(total, 0);
        }
      });

  window.GroupEffect.prototype = Object.create(constructor.prototype);
  Object.defineProperty(
      window.GroupEffect.prototype,
      'activeDuration',
      {
        get: function() {
          var max = 0;
          this.children.forEach(function(child) {
            max = Math.max(max, groupChildDuration(child));
          });
          return max;
        }
      });

  scope.newUnderlyingAnimationForGroup = function(group) {
    var underlyingAnimation;
    var timing = null;
    var ticker = function(tf) {
      var animation = underlyingAnimation._wrapper;
      if (!animation) {
        return;
      }
      if (animation.playState == 'pending') {
        return;
      }
      if (!animation.effect) {
        return;
      }
      if (tf == null) {
        animation._removeChildAnimations();
        return;
      }

      // If the group has a negative playback rate and is not fill backwards/both, then it should go
      // out of effect when it reaches the start of its active interval (tf == 0). If it is fill
      // backwards/both then it should stay in effect. calculateIterationProgress will return 0 in the
      // backwards-filling case, and null otherwise.
      if (tf == 0 && animation.playbackRate < 0) {
        if (!timing) {
          timing = shared.normalizeTimingInput(animation.effect.timing);
        }
        tf = shared.calculateIterationProgress(shared.calculateActiveDuration(timing), -1, timing);
        if (isNaN(tf) || tf == null) {
          animation._forEachChild(function(child) {
            child.currentTime = -1;
          });
          animation._removeChildAnimations();
          return;
        }
      }
    };

    var underlyingEffect = new KeyframeEffect(null, [], group._timing, group._id);
    underlyingEffect.onsample = ticker;
    underlyingAnimation = scope.timeline._play(underlyingEffect);
    return underlyingAnimation;
  };

  scope.bindAnimationForGroup = function(animation) {
    animation._animation._wrapper = animation;
    animation._isGroup = true;
    scope.awaitStartTime(animation);
    animation._constructChildAnimations();
    animation._setExternalAnimation(animation);
  };

  scope.groupChildDuration = groupChildDuration;

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
/**
   * @demo demo/index.html
   * @polymerBehavior
   */
  Polymer.IronControlState = {

    properties: {

      /**
       * If true, the element currently has focus.
       */
      focused: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true,
        reflectToAttribute: true
      },

      /**
       * If true, the user cannot interact with this element.
       */
      disabled: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '_disabledChanged',
        reflectToAttribute: true
      },

      _oldTabIndex: {
        type: Number
      },

      _boundFocusBlurHandler: {
        type: Function,
        value: function() {
          return this._focusBlurHandler.bind(this);
        }
      },

      __handleEventRetargeting: {
        type: Boolean,
        value: function() {
          return !this.shadowRoot && !Polymer.Element;
        }
      }
    },

    observers: [
      '_changedControlState(focused, disabled)'
    ],

    ready: function() {
      this.addEventListener('focus', this._boundFocusBlurHandler, true);
      this.addEventListener('blur', this._boundFocusBlurHandler, true);
    },

    _focusBlurHandler: function(event) {
      // In Polymer 2.0, the library takes care of retargeting events.
      if (Polymer.Element) {
        this._setFocused(event.type === 'focus');
        return;
      }

      // NOTE(cdata):  if we are in ShadowDOM land, `event.target` will
      // eventually become `this` due to retargeting; if we are not in
      // ShadowDOM land, `event.target` will eventually become `this` due
      // to the second conditional which fires a synthetic event (that is also
      // handled). In either case, we can disregard `event.path`.
      if (event.target === this) {
        this._setFocused(event.type === 'focus');
      } else if (this.__handleEventRetargeting) {
        var target = /** @type {Node} */(Polymer.dom(event).localTarget);
        if (!this.isLightDescendant(target)) {
          this.fire(event.type, {sourceEvent: event}, {
            node: this,
            bubbles: event.bubbles,
            cancelable: event.cancelable
          });
        }
      }
    },

    _disabledChanged: function(disabled, old) {
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      this.style.pointerEvents = disabled ? 'none' : '';
      if (disabled) {
        this._oldTabIndex = this.tabIndex;
        this._setFocused(false);
        this.tabIndex = -1;
        this.blur();
      } else if (this._oldTabIndex !== undefined) {
        this.tabIndex = this._oldTabIndex;
      }
    },

    _changedControlState: function() {
      // _controlStateChanged is abstract, follow-on behaviors may implement it
      if (this._controlStateChanged) {
        this._controlStateChanged();
      }
    }

  };
/**
   * Singleton IronMeta instance.
   */
  Polymer.IronValidatableBehaviorMeta = null;

  /**
   * `Use Polymer.IronValidatableBehavior` to implement an element that validates user input.
   * Use the related `Polymer.IronValidatorBehavior` to add custom validation logic to an iron-input.
   *
   * By default, an `<iron-form>` element validates its fields when the user presses the submit button.
   * To validate a form imperatively, call the form's `validate()` method, which in turn will
   * call `validate()` on all its children. By using `Polymer.IronValidatableBehavior`, your
   * custom element will get a public `validate()`, which
   * will return the validity of the element, and a corresponding `invalid` attribute,
   * which can be used for styling.
   *
   * To implement the custom validation logic of your element, you must override
   * the protected `_getValidity()` method of this behaviour, rather than `validate()`.
   * See [this](https://github.com/PolymerElements/iron-form/blob/master/demo/simple-element.html)
   * for an example.
   *
   * ### Accessibility
   *
   * Changing the `invalid` property, either manually or by calling `validate()` will update the
   * `aria-invalid` attribute.
   *
   * @demo demo/index.html
   * @polymerBehavior
   */
  Polymer.IronValidatableBehavior = {

    properties: {
      /**
       * Name of the validator to use.
       */
      validator: {
        type: String
      },

      /**
       * True if the last call to `validate` is invalid.
       */
      invalid: {
        notify: true,
        reflectToAttribute: true,
        type: Boolean,
        value: false,
        observer: '_invalidChanged'
      },
    },

    registered: function() {
      Polymer.IronValidatableBehaviorMeta = new Polymer.IronMeta({type: 'validator'});
    },

    _invalidChanged: function() {
      if (this.invalid) {
        this.setAttribute('aria-invalid', 'true');
      } else {
        this.removeAttribute('aria-invalid');
      }
    },

    /* Recompute this every time it's needed, because we don't know if the
     * underlying IronValidatableBehaviorMeta has changed. */
    get _validator() {
      return Polymer.IronValidatableBehaviorMeta &&
          Polymer.IronValidatableBehaviorMeta.byKey(this.validator);
    },

    /**
     * @return {boolean} True if the validator `validator` exists.
     */
    hasValidator: function() {
      return this._validator != null;
    },

    /**
     * Returns true if the `value` is valid, and updates `invalid`. If you want
     * your element to have custom validation logic, do not override this method;
     * override `_getValidity(value)` instead.

     * @param {Object} value Deprecated: The value to be validated. By default,
     * it is passed to the validator's `validate()` function, if a validator is set.
     * If this argument is not specified, then the element's `value` property
     * is used, if it exists.
     * @return {boolean} True if `value` is valid.
     */
    validate: function(value) {
      // If this is an element that also has a value property, and there was
      // no explicit value argument passed, use the element's property instead.
      if (value === undefined && this.value !== undefined)
        this.invalid = !this._getValidity(this.value);
      else
        this.invalid = !this._getValidity(value);
      return !this.invalid;
    },

    /**
     * Returns true if `value` is valid.  By default, it is passed
     * to the validator's `validate()` function, if a validator is set. You
     * should override this method if you want to implement custom validity
     * logic for your element.
     *
     * @param {Object} value The value to be validated.
     * @return {boolean} True if `value` is valid.
     */

    _getValidity: function(value) {
      if (this.hasValidator()) {
        return this._validator.validate(value);
      }
      return true;
    }
  };
Polymer({

    is: 'iron-autogrow-textarea',

    behaviors: [
      Polymer.IronValidatableBehavior,
      Polymer.IronControlState
    ],

    properties: {
      /**
       * Use this property instead of `bind-value` for two-way data binding.
       * @type {string|number}
       */
      value: {
        observer: '_valueChanged',
        type: String,
        notify: true
      },

      /**
       * This property is deprecated, and just mirrors `value`. Use `value` instead.
       * @type {string|number}
       */
      bindValue: {
        observer: '_bindValueChanged',
        type: String,
        notify: true
      },

      /**
       * The initial number of rows.
       *
       * @attribute rows
       * @type number
       * @default 1
       */
      rows: {
        type: Number,
        value: 1,
        observer: '_updateCached'
      },

      /**
       * The maximum number of rows this element can grow to until it
       * scrolls. 0 means no maximum.
       *
       * @attribute maxRows
       * @type number
       * @default 0
       */
      maxRows: {
       type: Number,
       value: 0,
       observer: '_updateCached'
      },

      /**
       * Bound to the textarea's `autocomplete` attribute.
       */
      autocomplete: {
        type: String,
        value: 'off'
      },

      /**
       * Bound to the textarea's `autofocus` attribute.
       */
      autofocus: {
        type: Boolean,
        value: false
      },

      /**
       * Bound to the textarea's `inputmode` attribute.
       */
      inputmode: {
        type: String
      },

      /**
       * Bound to the textarea's `placeholder` attribute.
       */
      placeholder: {
        type: String
      },

      /**
       * Bound to the textarea's `readonly` attribute.
       */
      readonly: {
        type: String
      },

      /**
       * Set to true to mark the textarea as required.
       */
      required: {
        type: Boolean
      },

      /**
       * The minimum length of the input value.
       */
      minlength: {
        type: Number
      },

      /**
       * The maximum length of the input value.
       */
      maxlength: {
        type: Number
      },

      /**
       * Bound to the textarea's `aria-label` attribute.
       */
      label: {
        type: String
      }

    },

    listeners: {
      'input': '_onInput'
    },

    /**
     * Returns the underlying textarea.
     * @type HTMLTextAreaElement
     */
    get textarea() {
      return this.$.textarea;
    },

    /**
     * Returns textarea's selection start.
     * @type Number
     */
    get selectionStart() {
      return this.$.textarea.selectionStart;
    },

    /**
     * Returns textarea's selection end.
     * @type Number
     */
    get selectionEnd() {
      return this.$.textarea.selectionEnd;
    },

    /**
     * Sets the textarea's selection start.
     */
    set selectionStart(value) {
      this.$.textarea.selectionStart = value;
    },

    /**
     * Sets the textarea's selection end.
     */
    set selectionEnd(value) {
      this.$.textarea.selectionEnd = value;
    },

    attached: function() {
      /* iOS has an arbitrary left margin of 3px that isn't present
       * in any other browser, and means that the paper-textarea's cursor
       * overlaps the label.
       * See https://github.com/PolymerElements/paper-input/issues/468.
       */
      var IS_IOS = navigator.userAgent.match(/iP(?:[oa]d|hone)/);
      if (IS_IOS) {
        this.$.textarea.style.marginLeft = '-3px';
      }
    },

    /**
     * Returns true if `value` is valid. The validator provided in `validator`
     * will be used first, if it exists; otherwise, the `textarea`'s validity
     * is used.
     * @return {boolean} True if the value is valid.
     */
    validate: function() {
      // Use the nested input's native validity.
      var valid =  this.$.textarea.validity.valid;

      // Only do extra checking if the browser thought this was valid.
      if (valid) {
        // Empty, required input is invalid
        if (this.required && this.value === '') {
          valid = false;
        } else if (this.hasValidator()) {
          valid = Polymer.IronValidatableBehavior.validate.call(this, this.value);
        }
      }

      this.invalid = !valid;
      this.fire('iron-input-validate');
      return valid;
    },

    _bindValueChanged: function(bindValue) {
      this.value = bindValue;
    },

    _valueChanged: function(value) {
      var textarea = this.textarea;
      if (!textarea) {
        return;
      }

      // If the bindValue changed manually, then we need to also update
      // the underlying textarea's value. Otherwise this change was probably
      // generated from the _onInput handler, and the two values are already
      // the same.
      if (textarea.value !== value) {
        textarea.value = !(value || value === 0) ? '' : value;
      }

      this.bindValue = value;
      this.$.mirror.innerHTML = this._valueForMirror();

      // This code is from early 1.0, when this element was a type extension.
      // It's unclear if it's still needed, but leaving in in case it is.
      // manually notify because we don't want to notify until after setting value.
      // this.fire('bind-value-changed', {value: this.bindValue});
    },

    _onInput: function(event) {
      var eventPath = Polymer.dom(event).path;
      this.value = eventPath ? eventPath[0].value : event.target.value;
    },

    _constrain: function(tokens) {
      var _tokens;
      tokens = tokens || [''];
      // Enforce the min and max heights for a multiline input to avoid measurement
      if (this.maxRows > 0 && tokens.length > this.maxRows) {
        _tokens = tokens.slice(0, this.maxRows);
      } else {
        _tokens = tokens.slice(0);
      }
      while (this.rows > 0 && _tokens.length < this.rows) {
        _tokens.push('');
      }
      // Use &#160; instead &nbsp; of to allow this element to be used in XHTML.
      return _tokens.join('<br/>') + '&#160;';
    },

    _valueForMirror: function() {
      var input = this.textarea;
      if (!input) {
        return;
      }
      this.tokens = (input && input.value) ? input.value.replace(/&/gm, '&amp;').replace(/"/gm, '&quot;').replace(/'/gm, '&#39;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;').split('\n') : [''];
      return this._constrain(this.tokens);
    },

    _updateCached: function() {
      this.$.mirror.innerHTML = this._constrain(this.tokens);
    },
  });
Polymer({

      is: 'iron-icon',

      properties: {

        /**
         * The name of the icon to use. The name should be of the form:
         * `iconset_name:icon_name`.
         */
        icon: {
          type: String
        },

        /**
         * The name of the theme to used, if one is specified by the
         * iconset.
         */
        theme: {
          type: String
        },

        /**
         * If using iron-icon without an iconset, you can set the src to be
         * the URL of an individual icon image file. Note that this will take
         * precedence over a given icon attribute.
         */
        src: {
          type: String
        },

        /**
         * @type {!Polymer.IronMeta}
         */
        _meta: {
          value: Polymer.Base.create('iron-meta', {type: 'iconset'})
        }

      },

      observers: [
        '_updateIcon(_meta, isAttached)',
        '_updateIcon(theme, isAttached)',
        '_srcChanged(src, isAttached)',
        '_iconChanged(icon, isAttached)'
      ],

      _DEFAULT_ICONSET: 'icons',

      _iconChanged: function(icon) {
        var parts = (icon || '').split(':');
        this._iconName = parts.pop();
        this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
        this._updateIcon();
      },

      _srcChanged: function(src) {
        this._updateIcon();
      },

      _usesIconset: function() {
        return this.icon || !this.src;
      },

      /** @suppress {visibility} */
      _updateIcon: function() {
        if (this._usesIconset()) {
          if (this._img && this._img.parentNode) {
            Polymer.dom(this.root).removeChild(this._img);
          }
          if (this._iconName === "") {
            if (this._iconset) {
              this._iconset.removeIcon(this);
            }
          } else if (this._iconsetName && this._meta) {
            this._iconset = /** @type {?Polymer.Iconset} */ (
              this._meta.byKey(this._iconsetName));
            if (this._iconset) {
              this._iconset.applyIcon(this, this._iconName, this.theme);
              this.unlisten(window, 'iron-iconset-added', '_updateIcon');
            } else {
              this.listen(window, 'iron-iconset-added', '_updateIcon');
            }
          }
        } else {
          if (this._iconset) {
            this._iconset.removeIcon(this);
          }
          if (!this._img) {
            this._img = document.createElement('img');
            this._img.style.width = '100%';
            this._img.style.height = '100%';
            this._img.draggable = false;
          }
          this._img.src = this.src;
          Polymer.dom(this.root).appendChild(this._img);
        }
      }

    });
/**
   * The `iron-iconset-svg` element allows users to define their own icon sets
   * that contain svg icons. The svg icon elements should be children of the
   * `iron-iconset-svg` element. Multiple icons should be given distinct id's.
   *
   * Using svg elements to create icons has a few advantages over traditional
   * bitmap graphics like jpg or png. Icons that use svg are vector based so
   * they are resolution independent and should look good on any device. They
   * are stylable via css. Icons can be themed, colorized, and even animated.
   *
   * Example:
   *
   *     <iron-iconset-svg name="my-svg-icons" size="24">
   *       <svg>
   *         <defs>
   *           <g id="shape">
   *             <rect x="12" y="0" width="12" height="24" />
   *             <circle cx="12" cy="12" r="12" />
   *           </g>
   *         </defs>
   *       </svg>
   *     </iron-iconset-svg>
   *
   * This will automatically register the icon set "my-svg-icons" to the iconset
   * database.  To use these icons from within another element, make a
   * `iron-iconset` element and call the `byId` method
   * to retrieve a given iconset. To apply a particular icon inside an
   * element use the `applyIcon` method. For example:
   *
   *     iconset.applyIcon(iconNode, 'car');
   *
   * @element iron-iconset-svg
   * @demo demo/index.html
   * @implements {Polymer.Iconset}
   */
  Polymer({
    is: 'iron-iconset-svg',

    properties: {

      /**
       * The name of the iconset.
       */
      name: {
        type: String,
        observer: '_nameChanged'
      },

      /**
       * The size of an individual icon. Note that icons must be square.
       */
      size: {
        type: Number,
        value: 24
      },

      /**
       * Set to true to enable mirroring of icons where specified when they are
       * stamped. Icons that should be mirrored should be decorated with a
       * `mirror-in-rtl` attribute.
       *
       * NOTE: For performance reasons, direction will be resolved once per
       * document per iconset, so moving icons in and out of RTL subtrees will
       * not cause their mirrored state to change.
       */
      rtlMirroring: {
        type: Boolean,
        value: false
      }
    },

    created: function() {
      this._meta = new Polymer.IronMeta({type: 'iconset', key: null, value: null});
    },

    attached: function() {
      this.style.display = 'none';
    },

    /**
     * Construct an array of all icon names in this iconset.
     *
     * @return {!Array} Array of icon names.
     */
    getIconNames: function() {
      this._icons = this._createIconMap();
      return Object.keys(this._icons).map(function(n) {
        return this.name + ':' + n;
      }, this);
    },

    /**
     * Applies an icon to the given element.
     *
     * An svg icon is prepended to the element's shadowRoot if it exists,
     * otherwise to the element itself.
     *
     * If RTL mirroring is enabled, and the icon is marked to be mirrored in
     * RTL, the element will be tested (once and only once ever for each
     * iconset) to determine the direction of the subtree the element is in.
     * This direction will apply to all future icon applications, although only
     * icons marked to be mirrored will be affected.
     *
     * @method applyIcon
     * @param {Element} element Element to which the icon is applied.
     * @param {string} iconName Name of the icon to apply.
     * @return {?Element} The svg element which renders the icon.
     */
    applyIcon: function(element, iconName) {
      // Remove old svg element
      this.removeIcon(element);
      // install new svg element
      var svg = this._cloneIcon(iconName,
          this.rtlMirroring && this._targetIsRTL(element));
      if (svg) {
        // insert svg element into shadow root, if it exists
        var pde = Polymer.dom(element.root || element);
        pde.insertBefore(svg, pde.childNodes[0]);
        return element._svgIcon = svg;
      }
      return null;
    },

    /**
     * Remove an icon from the given element by undoing the changes effected
     * by `applyIcon`.
     *
     * @param {Element} element The element from which the icon is removed.
     */
    removeIcon: function(element) {
      // Remove old svg element
      if (element._svgIcon) {
        Polymer.dom(element.root || element).removeChild(element._svgIcon);
        element._svgIcon = null;
      }
    },

    /**
     * Measures and memoizes the direction of the element. Note that this
     * measurement is only done once and the result is memoized for future
     * invocations.
     */
    _targetIsRTL: function(target) {
      if (this.__targetIsRTL == null) {
        if (target && target.nodeType !== Node.ELEMENT_NODE) {
          target = target.host;
        }

        this.__targetIsRTL = target &&
            window.getComputedStyle(target)['direction'] === 'rtl';
      }

      return this.__targetIsRTL;
    },

    /**
     *
     * When name is changed, register iconset metadata
     *
     */
    _nameChanged: function() {
      this._meta.value = null;
      this._meta.key = this.name;
      this._meta.value = this;

      this.async(function() {
        this.fire('iron-iconset-added', this, {node: window});
      });
    },

    /**
     * Create a map of child SVG elements by id.
     *
     * @return {!Object} Map of id's to SVG elements.
     */
    _createIconMap: function() {
      // Objects chained to Object.prototype (`{}`) have members. Specifically,
      // on FF there is a `watch` method that confuses the icon map, so we
      // need to use a null-based object here.
      var icons = Object.create(null);
      Polymer.dom(this).querySelectorAll('[id]')
        .forEach(function(icon) {
          icons[icon.id] = icon;
        });
      return icons;
    },

    /**
     * Produce installable clone of the SVG element matching `id` in this
     * iconset, or `undefined` if there is no matching element.
     *
     * @return {Element} Returns an installable clone of the SVG element
     * matching `id`.
     */
    _cloneIcon: function(id, mirrorAllowed) {
      // create the icon map on-demand, since the iconset itself has no discrete
      // signal to know when it's children are fully parsed
      this._icons = this._icons || this._createIconMap();
      return this._prepareSvgClone(this._icons[id], this.size, mirrorAllowed);
    },

    /**
     * @param {Element} sourceSvg
     * @param {number} size
     * @param {Boolean} mirrorAllowed
     * @return {Element}
     */
    _prepareSvgClone: function(sourceSvg, size, mirrorAllowed) {
      if (sourceSvg) {
        var content = sourceSvg.cloneNode(true),
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
            viewBox = content.getAttribute('viewBox') || '0 0 ' + size + ' ' + size,
            cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';

        if (mirrorAllowed && content.hasAttribute('mirror-in-rtl')) {
          cssText += '-webkit-transform:scale(-1,1);transform:scale(-1,1);';
        }

        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('focusable', 'false');
        // TODO(dfreedm): `pointer-events: none` works around https://crbug.com/370136
        // TODO(sjmiles): inline style may not be ideal, but avoids requiring a shadow-root
        svg.style.cssText = cssText;
        svg.appendChild(content).removeAttribute('id');
        return svg;
      }
      return null;
    }

  });
/**
  Polymer.IronFormElementBehavior enables a custom element to be included
  in an `iron-form`.

  Events `iron-form-element-register` and `iron-form-element-unregister` are not fired on Polymer 2.0.

  @demo demo/index.html
  @polymerBehavior
  */
  Polymer.IronFormElementBehavior = {

    properties: {
      /**
       * Fired when the element is added to an `iron-form`.
       *
       * @event iron-form-element-register
       */

      /**
       * Fired when the element is removed from an `iron-form`.
       *
       * @event iron-form-element-unregister
       */
       
      /**
       * The name of this element.
       */
      name: {
        type: String
      },

      /**
       * The value for this element.
       */
      value: {
        notify: true,
        type: String
      },

      /**
       * Set to true to mark the input as required. If used in a form, a
       * custom element that uses this behavior should also use
       * Polymer.IronValidatableBehavior and define a custom validation method.
       * Otherwise, a `required` element will always be considered valid.
       * It's also strongly recommended to provide a visual style for the element
       * when its value is invalid.
       */
      required: {
        type: Boolean,
        value: false
      },

      /**
       * The form that the element is registered to.
       */
      _parentForm: {
        type: Object
      }
    },

    attached: Polymer.Element ? null : function() {
      // Note: the iron-form that this element belongs to will set this
      // element's _parentForm property when handling this event.
      this.fire('iron-form-element-register');
    },

    detached: Polymer.Element ? null : function() {
      if (this._parentForm) {
        this._parentForm.fire('iron-form-element-unregister', {target: this});
      }
    }

  };
/**
   * Use `Polymer.IronCheckedElementBehavior` to implement a custom element
   * that has a `checked` property, which can be used for validation if the
   * element is also `required`. Element instances implementing this behavior
   * will also be registered for use in an `iron-form` element.
   *
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronCheckedElementBehavior
   */
  Polymer.IronCheckedElementBehaviorImpl = {

    properties: {
      /**
       * Fired when the checked state changes.
       *
       * @event iron-change
       */

      /**
       * Gets or sets the state, `true` is checked and `false` is unchecked.
       */
      checked: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        notify: true,
        observer: '_checkedChanged'
      },

      /**
       * If true, the button toggles the active state with each tap or press
       * of the spacebar.
       */
      toggles: {
        type: Boolean,
        value: true,
        reflectToAttribute: true
      },

      /* Overriden from Polymer.IronFormElementBehavior */
      value: {
        type: String,
        value: 'on',
        observer: '_valueChanged'
      }
    },

    observers: [
      '_requiredChanged(required)'
    ],

    created: function() {
      // Used by `iron-form` to handle the case that an element with this behavior
      // doesn't have a role of 'checkbox' or 'radio', but should still only be
      // included when the form is serialized if `this.checked === true`.
      this._hasIronCheckedElementBehavior = true;
    },

    /**
     * Returns false if the element is required and not checked, and true otherwise.
     * @param {*=} _value Ignored.
     * @return {boolean} true if `required` is false or if `checked` is true.
     */
    _getValidity: function(_value) {
      return this.disabled || !this.required || this.checked;
    },

    /**
     * Update the aria-required label when `required` is changed.
     */
    _requiredChanged: function() {
      if (this.required) {
        this.setAttribute('aria-required', 'true');
      } else {
        this.removeAttribute('aria-required');
      }
    },

    /**
     * Fire `iron-changed` when the checked state changes.
     */
    _checkedChanged: function() {
      this.active = this.checked;
      this.fire('iron-change');
    },

    /**
     * Reset value to 'on' if it is set to `undefined`.
     */
    _valueChanged: function() {
      if (this.value === undefined || this.value === null) {
        this.value = 'on';
      }
    }
  };

  /** @polymerBehavior Polymer.IronCheckedElementBehavior */
  Polymer.IronCheckedElementBehavior = [
    Polymer.IronFormElementBehavior,
    Polymer.IronValidatableBehavior,
    Polymer.IronCheckedElementBehaviorImpl
  ];
(function() {
    'use strict';

    /**
     * Chrome uses an older version of DOM Level 3 Keyboard Events
     *
     * Most keys are labeled as text, but some are Unicode codepoints.
     * Values taken from: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
     */
    var KEY_IDENTIFIER = {
      'U+0008': 'backspace',
      'U+0009': 'tab',
      'U+001B': 'esc',
      'U+0020': 'space',
      'U+007F': 'del'
    };

    /**
     * Special table for KeyboardEvent.keyCode.
     * KeyboardEvent.keyIdentifier is better, and KeyBoardEvent.key is even better
     * than that.
     *
     * Values from: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.keyCode#Value_of_keyCode
     */
    var KEY_CODE = {
      8: 'backspace',
      9: 'tab',
      13: 'enter',
      27: 'esc',
      33: 'pageup',
      34: 'pagedown',
      35: 'end',
      36: 'home',
      32: 'space',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down',
      46: 'del',
      106: '*'
    };

    /**
     * MODIFIER_KEYS maps the short name for modifier keys used in a key
     * combo string to the property name that references those same keys
     * in a KeyboardEvent instance.
     */
    var MODIFIER_KEYS = {
      'shift': 'shiftKey',
      'ctrl': 'ctrlKey',
      'alt': 'altKey',
      'meta': 'metaKey'
    };

    /**
     * KeyboardEvent.key is mostly represented by printable character made by
     * the keyboard, with unprintable keys labeled nicely.
     *
     * However, on OS X, Alt+char can make a Unicode character that follows an
     * Apple-specific mapping. In this case, we fall back to .keyCode.
     */
    var KEY_CHAR = /[a-z0-9*]/;

    /**
     * Matches a keyIdentifier string.
     */
    var IDENT_CHAR = /U\+/;

    /**
     * Matches arrow keys in Gecko 27.0+
     */
    var ARROW_KEY = /^arrow/;

    /**
     * Matches space keys everywhere (notably including IE10's exceptional name
     * `spacebar`).
     */
    var SPACE_KEY = /^space(bar)?/;

    /**
     * Matches ESC key.
     *
     * Value from: http://w3c.github.io/uievents-key/#key-Escape
     */
    var ESC_KEY = /^escape$/;

    /**
     * Transforms the key.
     * @param {string} key The KeyBoardEvent.key
     * @param {Boolean} [noSpecialChars] Limits the transformation to
     * alpha-numeric characters.
     */
    function transformKey(key, noSpecialChars) {
      var validKey = '';
      if (key) {
        var lKey = key.toLowerCase();
        if (lKey === ' ' || SPACE_KEY.test(lKey)) {
          validKey = 'space';
        } else if (ESC_KEY.test(lKey)) {
          validKey = 'esc';
        } else if (lKey.length == 1) {
          if (!noSpecialChars || KEY_CHAR.test(lKey)) {
            validKey = lKey;
          }
        } else if (ARROW_KEY.test(lKey)) {
          validKey = lKey.replace('arrow', '');
        } else if (lKey == 'multiply') {
          // numpad '*' can map to Multiply on IE/Windows
          validKey = '*';
        } else {
          validKey = lKey;
        }
      }
      return validKey;
    }

    function transformKeyIdentifier(keyIdent) {
      var validKey = '';
      if (keyIdent) {
        if (keyIdent in KEY_IDENTIFIER) {
          validKey = KEY_IDENTIFIER[keyIdent];
        } else if (IDENT_CHAR.test(keyIdent)) {
          keyIdent = parseInt(keyIdent.replace('U+', '0x'), 16);
          validKey = String.fromCharCode(keyIdent).toLowerCase();
        } else {
          validKey = keyIdent.toLowerCase();
        }
      }
      return validKey;
    }

    function transformKeyCode(keyCode) {
      var validKey = '';
      if (Number(keyCode)) {
        if (keyCode >= 65 && keyCode <= 90) {
          // ascii a-z
          // lowercase is 32 offset from uppercase
          validKey = String.fromCharCode(32 + keyCode);
        } else if (keyCode >= 112 && keyCode <= 123) {
          // function keys f1-f12
          validKey = 'f' + (keyCode - 112 + 1);
        } else if (keyCode >= 48 && keyCode <= 57) {
          // top 0-9 keys
          validKey = String(keyCode - 48);
        } else if (keyCode >= 96 && keyCode <= 105) {
          // num pad 0-9
          validKey = String(keyCode - 96);
        } else {
          validKey = KEY_CODE[keyCode];
        }
      }
      return validKey;
    }

    /**
      * Calculates the normalized key for a KeyboardEvent.
      * @param {KeyboardEvent} keyEvent
      * @param {Boolean} [noSpecialChars] Set to true to limit keyEvent.key
      * transformation to alpha-numeric chars. This is useful with key
      * combinations like shift + 2, which on FF for MacOS produces
      * keyEvent.key = @
      * To get 2 returned, set noSpecialChars = true
      * To get @ returned, set noSpecialChars = false
     */
    function normalizedKeyForEvent(keyEvent, noSpecialChars) {
      // Fall back from .key, to .detail.key for artifical keyboard events,
      // and then to deprecated .keyIdentifier and .keyCode.
      if (keyEvent.key) {
        return transformKey(keyEvent.key, noSpecialChars);
      }
      if (keyEvent.detail && keyEvent.detail.key) {
        return transformKey(keyEvent.detail.key, noSpecialChars);
      }
      return transformKeyIdentifier(keyEvent.keyIdentifier) ||
        transformKeyCode(keyEvent.keyCode) || '';
    }

    function keyComboMatchesEvent(keyCombo, event) {
      // For combos with modifiers we support only alpha-numeric keys
      var keyEvent = normalizedKeyForEvent(event, keyCombo.hasModifiers);
      return keyEvent === keyCombo.key &&
        (!keyCombo.hasModifiers || (
          !!event.shiftKey === !!keyCombo.shiftKey &&
          !!event.ctrlKey === !!keyCombo.ctrlKey &&
          !!event.altKey === !!keyCombo.altKey &&
          !!event.metaKey === !!keyCombo.metaKey)
        );
    }

    function parseKeyComboString(keyComboString) {
      if (keyComboString.length === 1) {
        return {
          combo: keyComboString,
          key: keyComboString,
          event: 'keydown'
        };
      }
      return keyComboString.split('+').reduce(function(parsedKeyCombo, keyComboPart) {
        var eventParts = keyComboPart.split(':');
        var keyName = eventParts[0];
        var event = eventParts[1];

        if (keyName in MODIFIER_KEYS) {
          parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
          parsedKeyCombo.hasModifiers = true;
        } else {
          parsedKeyCombo.key = keyName;
          parsedKeyCombo.event = event || 'keydown';
        }

        return parsedKeyCombo;
      }, {
        combo: keyComboString.split(':').shift()
      });
    }

    function parseEventString(eventString) {
      return eventString.trim().split(' ').map(function(keyComboString) {
        return parseKeyComboString(keyComboString);
      });
    }

    /**
     * `Polymer.IronA11yKeysBehavior` provides a normalized interface for processing
     * keyboard commands that pertain to [WAI-ARIA best practices](http://www.w3.org/TR/wai-aria-practices/#kbd_general_binding).
     * The element takes care of browser differences with respect to Keyboard events
     * and uses an expressive syntax to filter key presses.
     *
     * Use the `keyBindings` prototype property to express what combination of keys
     * will trigger the callback. A key binding has the format
     * `"KEY+MODIFIER:EVENT": "callback"` (`"KEY": "callback"` or
     * `"KEY:EVENT": "callback"` are valid as well). Some examples:
     *
     *      keyBindings: {
     *        'space': '_onKeydown', // same as 'space:keydown'
     *        'shift+tab': '_onKeydown',
     *        'enter:keypress': '_onKeypress',
     *        'esc:keyup': '_onKeyup'
     *      }
     *
     * The callback will receive with an event containing the following information in `event.detail`:
     *
     *      _onKeydown: function(event) {
     *        console.log(event.detail.combo); // KEY+MODIFIER, e.g. "shift+tab"
     *        console.log(event.detail.key); // KEY only, e.g. "tab"
     *        console.log(event.detail.event); // EVENT, e.g. "keydown"
     *        console.log(event.detail.keyboardEvent); // the original KeyboardEvent
     *      }
     *
     * Use the `keyEventTarget` attribute to set up event handlers on a specific
     * node.
     *
     * See the [demo source code](https://github.com/PolymerElements/iron-a11y-keys-behavior/blob/master/demo/x-key-aware.html)
     * for an example.
     *
     * @demo demo/index.html
     * @polymerBehavior
     */
    Polymer.IronA11yKeysBehavior = {
      properties: {
        /**
         * The EventTarget that will be firing relevant KeyboardEvents. Set it to
         * `null` to disable the listeners.
         * @type {?EventTarget}
         */
        keyEventTarget: {
          type: Object,
          value: function() {
            return this;
          }
        },

        /**
         * If true, this property will cause the implementing element to
         * automatically stop propagation on any handled KeyboardEvents.
         */
        stopKeyboardEventPropagation: {
          type: Boolean,
          value: false
        },

        _boundKeyHandlers: {
          type: Array,
          value: function() {
            return [];
          }
        },

        // We use this due to a limitation in IE10 where instances will have
        // own properties of everything on the "prototype".
        _imperativeKeyBindings: {
          type: Object,
          value: function() {
            return {};
          }
        }
      },

      observers: [
        '_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'
      ],


      /**
       * To be used to express what combination of keys  will trigger the relative
       * callback. e.g. `keyBindings: { 'esc': '_onEscPressed'}`
       * @type {!Object}
       */
      keyBindings: {},

      registered: function() {
        this._prepKeyBindings();
      },

      attached: function() {
        this._listenKeyEventListeners();
      },

      detached: function() {
        this._unlistenKeyEventListeners();
      },

      /**
       * Can be used to imperatively add a key binding to the implementing
       * element. This is the imperative equivalent of declaring a keybinding
       * in the `keyBindings` prototype property.
       *
       * @param {string} eventString
       * @param {string} handlerName
       */
      addOwnKeyBinding: function(eventString, handlerName) {
        this._imperativeKeyBindings[eventString] = handlerName;
        this._prepKeyBindings();
        this._resetKeyEventListeners();
      },

      /**
       * When called, will remove all imperatively-added key bindings.
       */
      removeOwnKeyBindings: function() {
        this._imperativeKeyBindings = {};
        this._prepKeyBindings();
        this._resetKeyEventListeners();
      },

      /**
       * Returns true if a keyboard event matches `eventString`.
       *
       * @param {KeyboardEvent} event
       * @param {string} eventString
       * @return {boolean}
       */
      keyboardEventMatchesKeys: function(event, eventString) {
        var keyCombos = parseEventString(eventString);
        for (var i = 0; i < keyCombos.length; ++i) {
          if (keyComboMatchesEvent(keyCombos[i], event)) {
            return true;
          }
        }
        return false;
      },

      _collectKeyBindings: function() {
        var keyBindings = this.behaviors.map(function(behavior) {
          return behavior.keyBindings;
        });

        if (keyBindings.indexOf(this.keyBindings) === -1) {
          keyBindings.push(this.keyBindings);
        }

        return keyBindings;
      },

      _prepKeyBindings: function() {
        this._keyBindings = {};

        this._collectKeyBindings().forEach(function(keyBindings) {
          for (var eventString in keyBindings) {
            this._addKeyBinding(eventString, keyBindings[eventString]);
          }
        }, this);

        for (var eventString in this._imperativeKeyBindings) {
          this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
        }

        // Give precedence to combos with modifiers to be checked first.
        for (var eventName in this._keyBindings) {
          this._keyBindings[eventName].sort(function (kb1, kb2) {
            var b1 = kb1[0].hasModifiers;
            var b2 = kb2[0].hasModifiers;
            return (b1 === b2) ? 0 : b1 ? -1 : 1;
          })
        }
      },

      _addKeyBinding: function(eventString, handlerName) {
        parseEventString(eventString).forEach(function(keyCombo) {
          this._keyBindings[keyCombo.event] =
            this._keyBindings[keyCombo.event] || [];

          this._keyBindings[keyCombo.event].push([
            keyCombo,
            handlerName
          ]);
        }, this);
      },

      _resetKeyEventListeners: function() {
        this._unlistenKeyEventListeners();

        if (this.isAttached) {
          this._listenKeyEventListeners();
        }
      },

      _listenKeyEventListeners: function() {
        if (!this.keyEventTarget) {
          return;
        }
        Object.keys(this._keyBindings).forEach(function(eventName) {
          var keyBindings = this._keyBindings[eventName];
          var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);

          this._boundKeyHandlers.push([this.keyEventTarget, eventName, boundKeyHandler]);

          this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
        }, this);
      },

      _unlistenKeyEventListeners: function() {
        var keyHandlerTuple;
        var keyEventTarget;
        var eventName;
        var boundKeyHandler;

        while (this._boundKeyHandlers.length) {
          // My kingdom for block-scope binding and destructuring assignment..
          keyHandlerTuple = this._boundKeyHandlers.pop();
          keyEventTarget = keyHandlerTuple[0];
          eventName = keyHandlerTuple[1];
          boundKeyHandler = keyHandlerTuple[2];

          keyEventTarget.removeEventListener(eventName, boundKeyHandler);
        }
      },

      _onKeyBindingEvent: function(keyBindings, event) {
        if (this.stopKeyboardEventPropagation) {
          event.stopPropagation();
        }

        // if event has been already prevented, don't do anything
        if (event.defaultPrevented) {
          return;
        }

        for (var i = 0; i < keyBindings.length; i++) {
          var keyCombo = keyBindings[i][0];
          var handlerName = keyBindings[i][1];
          if (keyComboMatchesEvent(keyCombo, event)) {
            this._triggerKeyHandler(keyCombo, handlerName, event);
            // exit the loop if eventDefault was prevented
            if (event.defaultPrevented) {
              return;
            }
          }
        }
      },

      _triggerKeyHandler: function(keyCombo, handlerName, keyboardEvent) {
        var detail = Object.create(keyCombo);
        detail.keyboardEvent = keyboardEvent;
        var event = new CustomEvent(keyCombo.event, {
          detail: detail,
          cancelable: true
        });
        this[handlerName].call(this, event);
        if (event.defaultPrevented) {
          keyboardEvent.preventDefault();
        }
      }
    };
  })();
/**
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronButtonState
   */
  Polymer.IronButtonStateImpl = {

    properties: {

      /**
       * If true, the user is currently holding down the button.
       */
      pressed: {
        type: Boolean,
        readOnly: true,
        value: false,
        reflectToAttribute: true,
        observer: '_pressedChanged'
      },

      /**
       * If true, the button toggles the active state with each tap or press
       * of the spacebar.
       */
      toggles: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * If true, the button is a toggle and is currently in the active state.
       */
      active: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true
      },

      /**
       * True if the element is currently being pressed by a "pointer," which
       * is loosely defined as mouse or touch input (but specifically excluding
       * keyboard input).
       */
      pointerDown: {
        type: Boolean,
        readOnly: true,
        value: false
      },

      /**
       * True if the input device that caused the element to receive focus
       * was a keyboard.
       */
      receivedFocusFromKeyboard: {
        type: Boolean,
        readOnly: true
      },

      /**
       * The aria attribute to be set if the button is a toggle and in the
       * active state.
       */
      ariaActiveAttribute: {
        type: String,
        value: 'aria-pressed',
        observer: '_ariaActiveAttributeChanged'
      }
    },

    listeners: {
      down: '_downHandler',
      up: '_upHandler',
      tap: '_tapHandler'
    },

    observers: [
      '_focusChanged(focused)',
      '_activeChanged(active, ariaActiveAttribute)'
    ],

    keyBindings: {
      'enter:keydown': '_asyncClick',
      'space:keydown': '_spaceKeyDownHandler',
      'space:keyup': '_spaceKeyUpHandler',
    },

    _mouseEventRe: /^mouse/,

    _tapHandler: function() {
      if (this.toggles) {
       // a tap is needed to toggle the active state
        this._userActivate(!this.active);
      } else {
        this.active = false;
      }
    },

    _focusChanged: function(focused) {
      this._detectKeyboardFocus(focused);

      if (!focused) {
        this._setPressed(false);
      }
    },

    _detectKeyboardFocus: function(focused) {
      this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
    },

    // to emulate native checkbox, (de-)activations from a user interaction fire
    // 'change' events
    _userActivate: function(active) {
      if (this.active !== active) {
        this.active = active;
        this.fire('change');
      }
    },

    _downHandler: function(event) {
      this._setPointerDown(true);
      this._setPressed(true);
      this._setReceivedFocusFromKeyboard(false);
    },

    _upHandler: function() {
      this._setPointerDown(false);
      this._setPressed(false);
    },

    /**
     * @param {!KeyboardEvent} event .
     */
    _spaceKeyDownHandler: function(event) {
      var keyboardEvent = event.detail.keyboardEvent;
      var target = Polymer.dom(keyboardEvent).localTarget;

      // Ignore the event if this is coming from a focused light child, since that
      // element will deal with it.
      if (this.isLightDescendant(/** @type {Node} */(target)))
        return;

      keyboardEvent.preventDefault();
      keyboardEvent.stopImmediatePropagation();
      this._setPressed(true);
    },

    /**
     * @param {!KeyboardEvent} event .
     */
    _spaceKeyUpHandler: function(event) {
      var keyboardEvent = event.detail.keyboardEvent;
      var target = Polymer.dom(keyboardEvent).localTarget;

      // Ignore the event if this is coming from a focused light child, since that
      // element will deal with it.
      if (this.isLightDescendant(/** @type {Node} */(target)))
        return;

      if (this.pressed) {
        this._asyncClick();
      }
      this._setPressed(false);
    },

    // trigger click asynchronously, the asynchrony is useful to allow one
    // event handler to unwind before triggering another event
    _asyncClick: function() {
      this.async(function() {
        this.click();
      }, 1);
    },

    // any of these changes are considered a change to button state

    _pressedChanged: function(pressed) {
      this._changedButtonState();
    },

    _ariaActiveAttributeChanged: function(value, oldValue) {
      if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
        this.removeAttribute(oldValue);
      }
    },

    _activeChanged: function(active, ariaActiveAttribute) {
      if (this.toggles) {
        this.setAttribute(this.ariaActiveAttribute,
                          active ? 'true' : 'false');
      } else {
        this.removeAttribute(this.ariaActiveAttribute);
      }
      this._changedButtonState();
    },

    _controlStateChanged: function() {
      if (this.disabled) {
        this._setPressed(false);
      } else {
        this._changedButtonState();
      }
    },

    // provide hook for follow-on behaviors to react to button-state

    _changedButtonState: function() {
      if (this._buttonStateChanged) {
        this._buttonStateChanged(); // abstract
      }
    }

  };

  /** @polymerBehavior */
  Polymer.IronButtonState = [
    Polymer.IronA11yKeysBehavior,
    Polymer.IronButtonStateImpl
  ];
(function() {
    'use strict';

    var Utility = {
      distance: function(x1, y1, x2, y2) {
        var xDelta = (x1 - x2);
        var yDelta = (y1 - y2);

        return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
      },

      now: window.performance && window.performance.now ?
          window.performance.now.bind(window.performance) : Date.now
    };

    /**
     * @param {HTMLElement} element
     * @constructor
     */
    function ElementMetrics(element) {
      this.element = element;
      this.width = this.boundingRect.width;
      this.height = this.boundingRect.height;

      this.size = Math.max(this.width, this.height);
    }

    ElementMetrics.prototype = {
      get boundingRect () {
        return this.element.getBoundingClientRect();
      },

      furthestCornerDistanceFrom: function(x, y) {
        var topLeft = Utility.distance(x, y, 0, 0);
        var topRight = Utility.distance(x, y, this.width, 0);
        var bottomLeft = Utility.distance(x, y, 0, this.height);
        var bottomRight = Utility.distance(x, y, this.width, this.height);

        return Math.max(topLeft, topRight, bottomLeft, bottomRight);
      }
    };

    /**
     * @param {HTMLElement} element
     * @constructor
     */
    function Ripple(element) {
      this.element = element;
      this.color = window.getComputedStyle(element).color;

      this.wave = document.createElement('div');
      this.waveContainer = document.createElement('div');
      this.wave.style.backgroundColor = this.color;
      this.wave.classList.add('wave');
      this.waveContainer.classList.add('wave-container');
      Polymer.dom(this.waveContainer).appendChild(this.wave);

      this.resetInteractionState();
    }

    Ripple.MAX_RADIUS = 300;

    Ripple.prototype = {
      get recenters() {
        return this.element.recenters;
      },

      get center() {
        return this.element.center;
      },

      get mouseDownElapsed() {
        var elapsed;

        if (!this.mouseDownStart) {
          return 0;
        }

        elapsed = Utility.now() - this.mouseDownStart;

        if (this.mouseUpStart) {
          elapsed -= this.mouseUpElapsed;
        }

        return elapsed;
      },

      get mouseUpElapsed() {
        return this.mouseUpStart ?
          Utility.now () - this.mouseUpStart : 0;
      },

      get mouseDownElapsedSeconds() {
        return this.mouseDownElapsed / 1000;
      },

      get mouseUpElapsedSeconds() {
        return this.mouseUpElapsed / 1000;
      },

      get mouseInteractionSeconds() {
        return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
      },

      get initialOpacity() {
        return this.element.initialOpacity;
      },

      get opacityDecayVelocity() {
        return this.element.opacityDecayVelocity;
      },

      get radius() {
        var width2 = this.containerMetrics.width * this.containerMetrics.width;
        var height2 = this.containerMetrics.height * this.containerMetrics.height;
        var waveRadius = Math.min(
          Math.sqrt(width2 + height2),
          Ripple.MAX_RADIUS
        ) * 1.1 + 5;

        var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
        var timeNow = this.mouseInteractionSeconds / duration;
        var size = waveRadius * (1 - Math.pow(80, -timeNow));

        return Math.abs(size);
      },

      get opacity() {
        if (!this.mouseUpStart) {
          return this.initialOpacity;
        }

        return Math.max(
          0,
          this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity
        );
      },

      get outerOpacity() {
        // Linear increase in background opacity, capped at the opacity
        // of the wavefront (waveOpacity).
        var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
        var waveOpacity = this.opacity;

        return Math.max(
          0,
          Math.min(outerOpacity, waveOpacity)
        );
      },

      get isOpacityFullyDecayed() {
        return this.opacity < 0.01 &&
          this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
      },

      get isRestingAtMaxRadius() {
        return this.opacity >= this.initialOpacity &&
          this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
      },

      get isAnimationComplete() {
        return this.mouseUpStart ?
          this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
      },

      get translationFraction() {
        return Math.min(
          1,
          this.radius / this.containerMetrics.size * 2 / Math.sqrt(2)
        );
      },

      get xNow() {
        if (this.xEnd) {
          return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
        }

        return this.xStart;
      },

      get yNow() {
        if (this.yEnd) {
          return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
        }

        return this.yStart;
      },

      get isMouseDown() {
        return this.mouseDownStart && !this.mouseUpStart;
      },

      resetInteractionState: function() {
        this.maxRadius = 0;
        this.mouseDownStart = 0;
        this.mouseUpStart = 0;

        this.xStart = 0;
        this.yStart = 0;
        this.xEnd = 0;
        this.yEnd = 0;
        this.slideDistance = 0;

        this.containerMetrics = new ElementMetrics(this.element);
      },

      draw: function() {
        var scale;
        var translateString;
        var dx;
        var dy;

        this.wave.style.opacity = this.opacity;

        scale = this.radius / (this.containerMetrics.size / 2);
        dx = this.xNow - (this.containerMetrics.width / 2);
        dy = this.yNow - (this.containerMetrics.height / 2);


        // 2d transform for safari because of border-radius and overflow:hidden clipping bug.
        // https://bugs.webkit.org/show_bug.cgi?id=98538
        this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
        this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
        this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
        this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
      },

      /** @param {Event=} event */
      downAction: function(event) {
        var xCenter = this.containerMetrics.width / 2;
        var yCenter = this.containerMetrics.height / 2;

        this.resetInteractionState();
        this.mouseDownStart = Utility.now();

        if (this.center) {
          this.xStart = xCenter;
          this.yStart = yCenter;
          this.slideDistance = Utility.distance(
            this.xStart, this.yStart, this.xEnd, this.yEnd
          );
        } else {
          this.xStart = event ?
              event.detail.x - this.containerMetrics.boundingRect.left :
              this.containerMetrics.width / 2;
          this.yStart = event ?
              event.detail.y - this.containerMetrics.boundingRect.top :
              this.containerMetrics.height / 2;
        }

        if (this.recenters) {
          this.xEnd = xCenter;
          this.yEnd = yCenter;
          this.slideDistance = Utility.distance(
            this.xStart, this.yStart, this.xEnd, this.yEnd
          );
        }

        this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(
          this.xStart,
          this.yStart
        );

        this.waveContainer.style.top =
          (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
        this.waveContainer.style.left =
          (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';

        this.waveContainer.style.width = this.containerMetrics.size + 'px';
        this.waveContainer.style.height = this.containerMetrics.size + 'px';
      },

      /** @param {Event=} event */
      upAction: function(event) {
        if (!this.isMouseDown) {
          return;
        }

        this.mouseUpStart = Utility.now();
      },

      remove: function() {
        Polymer.dom(this.waveContainer.parentNode).removeChild(
          this.waveContainer
        );
      }
    };

    Polymer({
      is: 'paper-ripple',

      behaviors: [
        Polymer.IronA11yKeysBehavior
      ],

      properties: {
        /**
         * The initial opacity set on the wave.
         *
         * @attribute initialOpacity
         * @type number
         * @default 0.25
         */
        initialOpacity: {
          type: Number,
          value: 0.25
        },

        /**
         * How fast (opacity per second) the wave fades out.
         *
         * @attribute opacityDecayVelocity
         * @type number
         * @default 0.8
         */
        opacityDecayVelocity: {
          type: Number,
          value: 0.8
        },

        /**
         * If true, ripples will exhibit a gravitational pull towards
         * the center of their container as they fade away.
         *
         * @attribute recenters
         * @type boolean
         * @default false
         */
        recenters: {
          type: Boolean,
          value: false
        },

        /**
         * If true, ripples will center inside its container
         *
         * @attribute recenters
         * @type boolean
         * @default false
         */
        center: {
          type: Boolean,
          value: false
        },

        /**
         * A list of the visual ripples.
         *
         * @attribute ripples
         * @type Array
         * @default []
         */
        ripples: {
          type: Array,
          value: function() {
            return [];
          }
        },

        /**
         * True when there are visible ripples animating within the
         * element.
         */
        animating: {
          type: Boolean,
          readOnly: true,
          reflectToAttribute: true,
          value: false
        },

        /**
         * If true, the ripple will remain in the "down" state until `holdDown`
         * is set to false again.
         */
        holdDown: {
          type: Boolean,
          value: false,
          observer: '_holdDownChanged'
        },

        /**
         * If true, the ripple will not generate a ripple effect
         * via pointer interaction.
         * Calling ripple's imperative api like `simulatedRipple` will
         * still generate the ripple effect.
         */
        noink: {
          type: Boolean,
          value: false
        },

        _animating: {
          type: Boolean
        },

        _boundAnimate: {
          type: Function,
          value: function() {
            return this.animate.bind(this);
          }
        }
      },

      get target () {
        return this.keyEventTarget;
      },

      keyBindings: {
        'enter:keydown': '_onEnterKeydown',
        'space:keydown': '_onSpaceKeydown',
        'space:keyup': '_onSpaceKeyup'
      },

      attached: function() {
        // Set up a11yKeysBehavior to listen to key events on the target,
        // so that space and enter activate the ripple even if the target doesn't
        // handle key events. The key handlers deal with `noink` themselves.
        if (this.parentNode.nodeType == 11) { // DOCUMENT_FRAGMENT_NODE
          this.keyEventTarget = Polymer.dom(this).getOwnerRoot().host;
        } else {
          this.keyEventTarget = this.parentNode;
        }
        var keyEventTarget = /** @type {!EventTarget} */ (this.keyEventTarget);
        this.listen(keyEventTarget, 'up', 'uiUpAction');
        this.listen(keyEventTarget, 'down', 'uiDownAction');
      },

      detached: function() {
        this.unlisten(this.keyEventTarget, 'up', 'uiUpAction');
        this.unlisten(this.keyEventTarget, 'down', 'uiDownAction');
        this.keyEventTarget = null;
      },

      get shouldKeepAnimating () {
        for (var index = 0; index < this.ripples.length; ++index) {
          if (!this.ripples[index].isAnimationComplete) {
            return true;
          }
        }

        return false;
      },

      simulatedRipple: function() {
        this.downAction(null);

        // Please see polymer/polymer#1305
        this.async(function() {
          this.upAction();
        }, 1);
      },

      /**
       * Provokes a ripple down effect via a UI event,
       * respecting the `noink` property.
       * @param {Event=} event
       */
      uiDownAction: function(event) {
        if (!this.noink) {
          this.downAction(event);
        }
      },

      /**
       * Provokes a ripple down effect via a UI event,
       * *not* respecting the `noink` property.
       * @param {Event=} event
       */
      downAction: function(event) {
        if (this.holdDown && this.ripples.length > 0) {
          return;
        }

        var ripple = this.addRipple();

        ripple.downAction(event);

        if (!this._animating) {
          this._animating = true;
          this.animate();
        }
      },

      /**
       * Provokes a ripple up effect via a UI event,
       * respecting the `noink` property.
       * @param {Event=} event
       */
      uiUpAction: function(event) {
        if (!this.noink) {
          this.upAction(event);
        }
      },

      /**
       * Provokes a ripple up effect via a UI event,
       * *not* respecting the `noink` property.
       * @param {Event=} event
       */
      upAction: function(event) {
        if (this.holdDown) {
          return;
        }

        this.ripples.forEach(function(ripple) {
          ripple.upAction(event);
        });

        this._animating = true;
        this.animate();
      },

      onAnimationComplete: function() {
        this._animating = false;
        this.$.background.style.backgroundColor = null;
        this.fire('transitionend');
      },

      addRipple: function() {
        var ripple = new Ripple(this);

        Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);
        this.$.background.style.backgroundColor = ripple.color;
        this.ripples.push(ripple);

        this._setAnimating(true);

        return ripple;
      },

      removeRipple: function(ripple) {
        var rippleIndex = this.ripples.indexOf(ripple);

        if (rippleIndex < 0) {
          return;
        }

        this.ripples.splice(rippleIndex, 1);

        ripple.remove();

        if (!this.ripples.length) {
          this._setAnimating(false);
        }
      },

      /**
       * This conflicts with Element#antimate().
       * https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
       * @suppress {checkTypes}
       */
      animate: function() {
        if (!this._animating) {
          return;
        }
        var index;
        var ripple;

        for (index = 0; index < this.ripples.length; ++index) {
          ripple = this.ripples[index];

          ripple.draw();

          this.$.background.style.opacity = ripple.outerOpacity;

          if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
            this.removeRipple(ripple);
          }
        }

        if (!this.shouldKeepAnimating && this.ripples.length === 0) {
          this.onAnimationComplete();
        } else {
          window.requestAnimationFrame(this._boundAnimate);
        }
      },

      _onEnterKeydown: function() {
        this.uiDownAction();
        this.async(this.uiUpAction, 1);
      },

      _onSpaceKeydown: function() {
        this.uiDownAction();
      },

      _onSpaceKeyup: function() {
        this.uiUpAction();
      },

      // note: holdDown does not respect noink since it can be a focus based
      // effect.
      _holdDownChanged: function(newVal, oldVal) {
        if (oldVal === undefined) {
          return;
        }
        if (newVal) {
          this.downAction();
        } else {
          this.upAction();
        }
      }

      /**
      Fired when the animation finishes.
      This is useful if you want to wait until
      the ripple animation finishes to perform some action.

      @event transitionend
      @param {{node: Object}} detail Contains the animated node.
      */
    });
  })();
/**
   * `Polymer.PaperRippleBehavior` dynamically implements a ripple
   * when the element has focus via pointer or keyboard.
   *
   * NOTE: This behavior is intended to be used in conjunction with and after
   * `Polymer.IronButtonState` and `Polymer.IronControlState`.
   *
   * @polymerBehavior Polymer.PaperRippleBehavior
   */
  Polymer.PaperRippleBehavior = {
    properties: {
      /**
       * If true, the element will not produce a ripple effect when interacted
       * with via the pointer.
       */
      noink: {
        type: Boolean,
        observer: '_noinkChanged'
      },

      /**
       * @type {Element|undefined}
       */
      _rippleContainer: {
        type: Object,
      }
    },

    /**
     * Ensures a `<paper-ripple>` element is available when the element is
     * focused.
     */
    _buttonStateChanged: function() {
      if (this.focused) {
        this.ensureRipple();
      }
    },

    /**
     * In addition to the functionality provided in `IronButtonState`, ensures
     * a ripple effect is created when the element is in a `pressed` state.
     */
    _downHandler: function(event) {
      Polymer.IronButtonStateImpl._downHandler.call(this, event);
      if (this.pressed) {
        this.ensureRipple(event);
      }
    },

    /**
     * Ensures this element contains a ripple effect. For startup efficiency
     * the ripple effect is dynamically on demand when needed.
     * @param {!Event=} optTriggeringEvent (optional) event that triggered the
     * ripple.
     */
    ensureRipple: function(optTriggeringEvent) {
      if (!this.hasRipple()) {
        this._ripple = this._createRipple();
        this._ripple.noink = this.noink;
        var rippleContainer = this._rippleContainer || this.root;
        if (rippleContainer) {
          Polymer.dom(rippleContainer).appendChild(this._ripple);
        }
        if (optTriggeringEvent) {
          // Check if the event happened inside of the ripple container
          // Fall back to host instead of the root because distributed text
          // nodes are not valid event targets
          var domContainer = Polymer.dom(this._rippleContainer || this);
          var target = Polymer.dom(optTriggeringEvent).rootTarget;
          if (domContainer.deepContains( /** @type {Node} */(target))) {
            this._ripple.uiDownAction(optTriggeringEvent);
          }
        }
      }
    },

    /**
     * Returns the `<paper-ripple>` element used by this element to create
     * ripple effects. The element's ripple is created on demand, when
     * necessary, and calling this method will force the
     * ripple to be created.
     */
    getRipple: function() {
      this.ensureRipple();
      return this._ripple;
    },

    /**
     * Returns true if this element currently contains a ripple effect.
     * @return {boolean}
     */
    hasRipple: function() {
      return Boolean(this._ripple);
    },

    /**
     * Create the element's ripple effect via creating a `<paper-ripple>`.
     * Override this method to customize the ripple element.
     * @return {!PaperRippleElement} Returns a `<paper-ripple>` element.
     */
    _createRipple: function() {
      return /** @type {!PaperRippleElement} */ (
          document.createElement('paper-ripple'));
    },

    _noinkChanged: function(noink) {
      if (this.hasRipple()) {
        this._ripple.noink = noink;
      }
    }
  };
/**
   * `Polymer.PaperInkyFocusBehavior` implements a ripple when the element has keyboard focus.
   *
   * @polymerBehavior Polymer.PaperInkyFocusBehavior
   */
  Polymer.PaperInkyFocusBehaviorImpl = {
    observers: [
      '_focusedChanged(receivedFocusFromKeyboard)'
    ],

    _focusedChanged: function(receivedFocusFromKeyboard) {
      if (receivedFocusFromKeyboard) {
        this.ensureRipple();
      }
      if (this.hasRipple()) {
        this._ripple.holdDown = receivedFocusFromKeyboard;
      }
    },

    _createRipple: function() {
      var ripple = Polymer.PaperRippleBehavior._createRipple();
      ripple.id = 'ink';
      ripple.setAttribute('center', '');
      ripple.classList.add('circle');
      return ripple;
    }
  };

  /** @polymerBehavior Polymer.PaperInkyFocusBehavior */
  Polymer.PaperInkyFocusBehavior = [
    Polymer.IronButtonState,
    Polymer.IronControlState,
    Polymer.PaperRippleBehavior,
    Polymer.PaperInkyFocusBehaviorImpl
  ];
/**
   * Use `Polymer.PaperCheckedElementBehavior` to implement a custom element
   * that has a `checked` property similar to `Polymer.IronCheckedElementBehavior`
   * and is compatible with having a ripple effect.
   * @polymerBehavior Polymer.PaperCheckedElementBehavior
   */
  Polymer.PaperCheckedElementBehaviorImpl = {
    /**
     * Synchronizes the element's checked state with its ripple effect.
     */
    _checkedChanged: function() {
      Polymer.IronCheckedElementBehaviorImpl._checkedChanged.call(this);
      if (this.hasRipple()) {
        if (this.checked) {
          this._ripple.setAttribute('checked', '');
        } else {
          this._ripple.removeAttribute('checked');
        }
      }
    },

    /**
     * Synchronizes the element's `active` and `checked` state.
     */
    _buttonStateChanged: function() {
      Polymer.PaperRippleBehavior._buttonStateChanged.call(this);
      if (this.disabled) {
        return;
      }
      if (this.isAttached) {
        this.checked = this.active;
      }
    }
  };

  /** @polymerBehavior Polymer.PaperCheckedElementBehavior */
  Polymer.PaperCheckedElementBehavior = [
    Polymer.PaperInkyFocusBehavior,
    Polymer.IronCheckedElementBehavior,
    Polymer.PaperCheckedElementBehaviorImpl
  ];
Polymer({
      is: 'paper-checkbox',

      behaviors: [
        Polymer.PaperCheckedElementBehavior
      ],

      hostAttributes: {
        role: 'checkbox',
        'aria-checked': false,
        tabindex: 0
      },

      properties: {
        /**
         * Fired when the checked state changes due to user interaction.
         *
         * @event change
         */

        /**
         * Fired when the checked state changes.
         *
         * @event iron-change
         */
        ariaActiveAttribute: {
          type: String,
          value: 'aria-checked'
        }
      },

      attached: function() {
        // Wait until styles have resolved to check for the default sentinel.
        // See polymer#4009 for more details.
        Polymer.RenderStatus.afterNextRender(this, function() {
          var inkSize = this.getComputedStyleValue('--calculated-paper-checkbox-ink-size').trim();
          // If unset, compute and set the default `--paper-checkbox-ink-size`.
          if (inkSize === '-1px') {
            var checkboxSizeText = this.getComputedStyleValue('--calculated-paper-checkbox-size').trim();

            var units = checkboxSizeText.match(/[A-Za-z]+$/)[0] || 'px';
            var checkboxSize = parseFloat(checkboxSizeText, 10);
            var defaultInkSize = (8 / 3) * checkboxSize;

            if (units === 'px') {
              defaultInkSize = Math.floor(defaultInkSize);

              // The checkbox and ripple need to have the same parity so that their
              // centers align.
              if (defaultInkSize % 2 !== checkboxSize % 2) {
                defaultInkSize++;
              }
            }

            this.updateStyles({
              '--paper-checkbox-ink-size': defaultInkSize + units,
            });
          }
        });
      },

      _computeCheckboxClass: function(checked, invalid) {
        var className = '';
        if (checked) {
          className += 'checked ';
        }
        if (invalid) {
          className += 'invalid';
        }
        return className;
      },

      _computeCheckmarkClass: function(checked) {
        return checked ? '' : 'hidden';
      },

      // create ripple inside the checkboxContainer
      _createRipple: function() {
        this._rippleContainer = this.$.checkboxContainer;
        return Polymer.PaperInkyFocusBehaviorImpl._createRipple.call(this);
      }

    });
/**
   * `Polymer.NeonAnimatableBehavior` is implemented by elements containing animations for use with
   * elements implementing `Polymer.NeonAnimationRunnerBehavior`.
   * @polymerBehavior
   */
  Polymer.NeonAnimatableBehavior = {

    properties: {

      /**
       * Animation configuration. See README for more info.
       */
      animationConfig: {
        type: Object
      },

      /**
       * Convenience property for setting an 'entry' animation. Do not set `animationConfig.entry`
       * manually if using this. The animated node is set to `this` if using this property.
       */
      entryAnimation: {
        observer: '_entryAnimationChanged',
        type: String
      },

      /**
       * Convenience property for setting an 'exit' animation. Do not set `animationConfig.exit`
       * manually if using this. The animated node is set to `this` if using this property.
       */
      exitAnimation: {
        observer: '_exitAnimationChanged',
        type: String
      }

    },

    _entryAnimationChanged: function() {
      this.animationConfig = this.animationConfig || {};
      this.animationConfig['entry'] = [{
        name: this.entryAnimation,
        node: this
      }];
    },

    _exitAnimationChanged: function() {
      this.animationConfig = this.animationConfig || {};
      this.animationConfig['exit'] = [{
        name: this.exitAnimation,
        node: this
      }];
    },

    _copyProperties: function(config1, config2) {
      // shallowly copy properties from config2 to config1
      for (var property in config2) {
        config1[property] = config2[property];
      }
    },

    _cloneConfig: function(config) {
      var clone = {
        isClone: true
      };
      this._copyProperties(clone, config);
      return clone;
    },

    _getAnimationConfigRecursive: function(type, map, allConfigs) {
      if (!this.animationConfig) {
        return;
      }

      if(this.animationConfig.value && typeof this.animationConfig.value === 'function') {
      	this._warn(this._logf('playAnimation', "Please put 'animationConfig' inside of your components 'properties' object instead of outside of it."));
      	return;
      }

      // type is optional
      var thisConfig;
      if (type) {
        thisConfig = this.animationConfig[type];
      } else {
        thisConfig = this.animationConfig;
      }

      if (!Array.isArray(thisConfig)) {
        thisConfig = [thisConfig];
      }

      // iterate animations and recurse to process configurations from child nodes
      if (thisConfig) {
        for (var config, index = 0; config = thisConfig[index]; index++) {
          if (config.animatable) {
            config.animatable._getAnimationConfigRecursive(config.type || type, map, allConfigs);
          } else {
            if (config.id) {
              var cachedConfig = map[config.id];
              if (cachedConfig) {
                // merge configurations with the same id, making a clone lazily
                if (!cachedConfig.isClone) {
                  map[config.id] = this._cloneConfig(cachedConfig);
                  cachedConfig = map[config.id];
                }
                this._copyProperties(cachedConfig, config);
              } else {
                // put any configs with an id into a map
                map[config.id] = config;
              }
            } else {
              allConfigs.push(config);
            }
          }
        }
      }
    },

    /**
     * An element implementing `Polymer.NeonAnimationRunnerBehavior` calls this method to configure
     * an animation with an optional type. Elements implementing `Polymer.NeonAnimatableBehavior`
     * should define the property `animationConfig`, which is either a configuration object
     * or a map of animation type to array of configuration objects.
     */
    getAnimationConfig: function(type) {
      var map = {};
      var allConfigs = [];
      this._getAnimationConfigRecursive(type, map, allConfigs);
      // append the configurations saved in the map to the array
      for (var key in map) {
        allConfigs.push(map[key]);
      }
      return allConfigs;
    }

  };
/**
   * `Polymer.NeonAnimationRunnerBehavior` adds a method to run animations.
   *
   * @polymerBehavior Polymer.NeonAnimationRunnerBehavior
   */
  Polymer.NeonAnimationRunnerBehaviorImpl = {

    _configureAnimations: function(configs) {
      var results = [];
      if (configs.length > 0) {
        for (var config, index = 0; config = configs[index]; index++) {
          var neonAnimation = document.createElement(config.name);
          // is this element actually a neon animation?
          if (neonAnimation.isNeonAnimation) {
            var result = null;
            // configuration or play could fail if polyfills aren't loaded
            try {
              result = neonAnimation.configure(config);
              // Check if we have an Effect rather than an Animation
              if (typeof result.cancel != 'function') {
                result = document.timeline.play(result);
              }
            } catch (e) {
              result = null;
              console.warn('Couldnt play', '(', config.name, ').', e);
            }
            if (result) {
              results.push({
                neonAnimation: neonAnimation,
                config: config,
                animation: result,
              });
            }
          } else {
            console.warn(this.is + ':', config.name, 'not found!');
          }
        }
      }
      return results;
    },

    _shouldComplete: function(activeEntries) {
      var finished = true;
      for (var i = 0; i < activeEntries.length; i++) {
        if (activeEntries[i].animation.playState != 'finished') {
          finished = false;
          break;
        }
      }
      return finished;
    },

    _complete: function(activeEntries) {
      for (var i = 0; i < activeEntries.length; i++) {
        activeEntries[i].neonAnimation.complete(activeEntries[i].config);
      }
      for (var i = 0; i < activeEntries.length; i++) {
        activeEntries[i].animation.cancel();
      }
    },

    /**
     * Plays an animation with an optional `type`.
     * @param {string=} type
     * @param {!Object=} cookie
     */
    playAnimation: function(type, cookie) {
      var configs = this.getAnimationConfig(type);
      if (!configs) {
        return;
      }
      this._active = this._active || {};
      if (this._active[type]) {
        this._complete(this._active[type]);
        delete this._active[type];
      }

      var activeEntries = this._configureAnimations(configs);

      if (activeEntries.length == 0) {
        this.fire('neon-animation-finish', cookie, {bubbles: false});
        return;
      }

      this._active[type] = activeEntries;

      for (var i = 0; i < activeEntries.length; i++) {
        activeEntries[i].animation.onfinish = function() {
          if (this._shouldComplete(activeEntries)) {
            this._complete(activeEntries);
            delete this._active[type];
            this.fire('neon-animation-finish', cookie, {bubbles: false});
          }
        }.bind(this);
      }
    },

    /**
     * Cancels the currently running animations.
     */
    cancelAnimation: function() {
      for (var k in this._animations) {
        this._animations[k].cancel();
      }
      this._animations = {};
    }
  };

  /** @polymerBehavior Polymer.NeonAnimationRunnerBehavior */
  Polymer.NeonAnimationRunnerBehavior = [
    Polymer.NeonAnimatableBehavior,
    Polymer.NeonAnimationRunnerBehaviorImpl
  ];
/**
`Polymer.IronFitBehavior` fits an element in another element using `max-height` and `max-width`, and
optionally centers it in the window or another element.

The element will only be sized and/or positioned if it has not already been sized and/or positioned
by CSS.

CSS properties               | Action
-----------------------------|-------------------------------------------
`position` set               | Element is not centered horizontally or vertically
`top` or `bottom` set        | Element is not vertically centered
`left` or `right` set        | Element is not horizontally centered
`max-height` set             | Element respects `max-height`
`max-width` set              | Element respects `max-width`

`Polymer.IronFitBehavior` can position an element into another element using
`verticalAlign` and `horizontalAlign`. This will override the element's css position.

      <div class="container">
        <iron-fit-impl vertical-align="top" horizontal-align="auto">
          Positioned into the container
        </iron-fit-impl>
      </div>

Use `noOverlap` to position the element around another element without overlapping it.

      <div class="container">
        <iron-fit-impl no-overlap vertical-align="auto" horizontal-align="auto">
          Positioned around the container
        </iron-fit-impl>
      </div>

Use `horizontalOffset, verticalOffset` to offset the element from its `positionTarget`;
`Polymer.IronFitBehavior` will collapse these in order to keep the element
within `fitInto` boundaries, while preserving the element's CSS margin values.

      <div class="container">
        <iron-fit-impl vertical-align="top" vertical-offset="20">
          With vertical offset
        </iron-fit-impl>
      </div>


@demo demo/index.html
@polymerBehavior
*/
  Polymer.IronFitBehavior = {

    properties: {

      /**
       * The element that will receive a `max-height`/`width`. By default it is the same as `this`,
       * but it can be set to a child element. This is useful, for example, for implementing a
       * scrolling region inside the element.
       * @type {!Element}
       */
      sizingTarget: {
        type: Object,
        value: function() {
          return this;
        }
      },

      /**
       * The element to fit `this` into.
       */
      fitInto: {
        type: Object,
        value: window
      },

      /**
       * Will position the element around the positionTarget without overlapping it.
       */
      noOverlap: {
        type: Boolean
      },

      /**
       * The element that should be used to position the element. If not set, it will
       * default to the parent node.
       * @type {!Element}
       */
      positionTarget: {
        type: Element
      },

      /**
       * The orientation against which to align the element horizontally
       * relative to the `positionTarget`. Possible values are "left", "right", "auto".
       */
      horizontalAlign: {
        type: String
      },

      /**
       * The orientation against which to align the element vertically
       * relative to the `positionTarget`. Possible values are "top", "bottom", "auto".
       */
      verticalAlign: {
        type: String
      },

      /**
       * If true, it will use `horizontalAlign` and `verticalAlign` values as preferred alignment
       * and if there's not enough space, it will pick the values which minimize the cropping.
       */
      dynamicAlign: {
        type: Boolean
      },

      /**
       * A pixel value that will be added to the position calculated for the
       * given `horizontalAlign`, in the direction of alignment. You can think
       * of it as increasing or decreasing the distance to the side of the
       * screen given by `horizontalAlign`.
       *
       * If `horizontalAlign` is "left", this offset will increase or decrease
       * the distance to the left side of the screen: a negative offset will
       * move the dropdown to the left; a positive one, to the right.
       *
       * Conversely if `horizontalAlign` is "right", this offset will increase
       * or decrease the distance to the right side of the screen: a negative
       * offset will move the dropdown to the right; a positive one, to the left.
       */
      horizontalOffset: {
        type: Number,
        value: 0,
        notify: true
      },

      /**
       * A pixel value that will be added to the position calculated for the
       * given `verticalAlign`, in the direction of alignment. You can think
       * of it as increasing or decreasing the distance to the side of the
       * screen given by `verticalAlign`.
       *
       * If `verticalAlign` is "top", this offset will increase or decrease
       * the distance to the top side of the screen: a negative offset will
       * move the dropdown upwards; a positive one, downwards.
       *
       * Conversely if `verticalAlign` is "bottom", this offset will increase
       * or decrease the distance to the bottom side of the screen: a negative
       * offset will move the dropdown downwards; a positive one, upwards.
       */
      verticalOffset: {
        type: Number,
        value: 0,
        notify: true
      },

      /**
       * Set to true to auto-fit on attach.
       */
      autoFitOnAttach: {
        type: Boolean,
        value: false
      },

      /** @type {?Object} */
      _fitInfo: {
        type: Object
      }
    },

    get _fitWidth() {
      var fitWidth;
      if (this.fitInto === window) {
        fitWidth = this.fitInto.innerWidth;
      } else {
        fitWidth = this.fitInto.getBoundingClientRect().width;
      }
      return fitWidth;
    },

    get _fitHeight() {
      var fitHeight;
      if (this.fitInto === window) {
        fitHeight = this.fitInto.innerHeight;
      } else {
        fitHeight = this.fitInto.getBoundingClientRect().height;
      }
      return fitHeight;
    },

    get _fitLeft() {
      var fitLeft;
      if (this.fitInto === window) {
        fitLeft = 0;
      } else {
        fitLeft = this.fitInto.getBoundingClientRect().left;
      }
      return fitLeft;
    },

    get _fitTop() {
      var fitTop;
      if (this.fitInto === window) {
        fitTop = 0;
      } else {
        fitTop = this.fitInto.getBoundingClientRect().top;
      }
      return fitTop;
    },

    /**
     * The element that should be used to position the element,
     * if no position target is configured.
     */
    get _defaultPositionTarget() {
      var parent = Polymer.dom(this).parentNode;

      if (parent && parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        parent = parent.host;
      }

      return parent;
    },

    /**
     * The horizontal align value, accounting for the RTL/LTR text direction.
     */
    get _localeHorizontalAlign() {
      if (this._isRTL) {
        // In RTL, "left" becomes "right".
        if (this.horizontalAlign === 'right') {
          return 'left';
        }
        if (this.horizontalAlign === 'left') {
          return 'right';
        }
      }
      return this.horizontalAlign;
    },

    attached: function() {
      // Memoize this to avoid expensive calculations & relayouts.
      // Make sure we do it only once
      if (typeof this._isRTL === 'undefined') {
        this._isRTL = window.getComputedStyle(this).direction == 'rtl';
      }
      this.positionTarget = this.positionTarget || this._defaultPositionTarget;
      if (this.autoFitOnAttach) {
        if (window.getComputedStyle(this).display === 'none') {
          setTimeout(function() {
            this.fit();
          }.bind(this));
        } else {
          // NOTE: shadydom applies distribution asynchronously
          // for performance reasons webcomponents/shadydom#120
          // Flush to get correct layout info.
          window.ShadyDOM && ShadyDOM.flush();
          this.fit();
        }
      }
    },

    detached: function() {
      if (this.__deferredFit) {
        clearTimeout(this.__deferredFit);
        this.__deferredFit = null;
      }
    },

    /**
     * Positions and fits the element into the `fitInto` element.
     */
    fit: function() {
      this.position();
      this.constrain();
      this.center();
    },

    /**
     * Memoize information needed to position and size the target element.
     * @suppress {deprecated}
     */
    _discoverInfo: function() {
      if (this._fitInfo) {
        return;
      }
      var target = window.getComputedStyle(this);
      var sizer = window.getComputedStyle(this.sizingTarget);

      this._fitInfo = {
        inlineStyle: {
          top: this.style.top || '',
          left: this.style.left || '',
          position: this.style.position || ''
        },
        sizerInlineStyle: {
          maxWidth: this.sizingTarget.style.maxWidth || '',
          maxHeight: this.sizingTarget.style.maxHeight || '',
          boxSizing: this.sizingTarget.style.boxSizing || ''
        },
        positionedBy: {
          vertically: target.top !== 'auto' ? 'top' : (target.bottom !== 'auto' ?
            'bottom' : null),
          horizontally: target.left !== 'auto' ? 'left' : (target.right !== 'auto' ?
            'right' : null)
        },
        sizedBy: {
          height: sizer.maxHeight !== 'none',
          width: sizer.maxWidth !== 'none',
          minWidth: parseInt(sizer.minWidth, 10) || 0,
          minHeight: parseInt(sizer.minHeight, 10) || 0
        },
        margin: {
          top: parseInt(target.marginTop, 10) || 0,
          right: parseInt(target.marginRight, 10) || 0,
          bottom: parseInt(target.marginBottom, 10) || 0,
          left: parseInt(target.marginLeft, 10) || 0
        }
      };
    },

    /**
     * Resets the target element's position and size constraints, and clear
     * the memoized data.
     */
    resetFit: function() {
      var info = this._fitInfo || {};
      for (var property in info.sizerInlineStyle) {
        this.sizingTarget.style[property] = info.sizerInlineStyle[property];
      }
      for (var property in info.inlineStyle) {
        this.style[property] = info.inlineStyle[property];
      }

      this._fitInfo = null;
    },

    /**
     * Equivalent to calling `resetFit()` and `fit()`. Useful to call this after
     * the element or the `fitInto` element has been resized, or if any of the
     * positioning properties (e.g. `horizontalAlign, verticalAlign`) is updated.
     * It preserves the scroll position of the sizingTarget.
     */
    refit: function() {
      var scrollLeft = this.sizingTarget.scrollLeft;
      var scrollTop = this.sizingTarget.scrollTop;
      this.resetFit();
      this.fit();
      this.sizingTarget.scrollLeft = scrollLeft;
      this.sizingTarget.scrollTop = scrollTop;
    },

    /**
     * Positions the element according to `horizontalAlign, verticalAlign`.
     */
    position: function() {
      if (!this.horizontalAlign && !this.verticalAlign) {
        // needs to be centered, and it is done after constrain.
        return;
      }
      this._discoverInfo();

      this.style.position = 'fixed';
      // Need border-box for margin/padding.
      this.sizingTarget.style.boxSizing = 'border-box';
      // Set to 0, 0 in order to discover any offset caused by parent stacking contexts.
      this.style.left = '0px';
      this.style.top = '0px';

      var rect = this.getBoundingClientRect();
      var positionRect = this.__getNormalizedRect(this.positionTarget);
      var fitRect = this.__getNormalizedRect(this.fitInto);

      var margin = this._fitInfo.margin;

      // Consider the margin as part of the size for position calculations.
      var size = {
        width: rect.width + margin.left + margin.right,
        height: rect.height + margin.top + margin.bottom
      };

      var position = this.__getPosition(this._localeHorizontalAlign, this.verticalAlign, size, positionRect,
        fitRect);

      var left = position.left + margin.left;
      var top = position.top + margin.top;

      // We first limit right/bottom within fitInto respecting the margin,
      // then use those values to limit top/left.
      var right = Math.min(fitRect.right - margin.right, left + rect.width);
      var bottom = Math.min(fitRect.bottom - margin.bottom, top + rect.height);

      // Keep left/top within fitInto respecting the margin.
      left = Math.max(fitRect.left + margin.left,
        Math.min(left, right - this._fitInfo.sizedBy.minWidth));
      top = Math.max(fitRect.top + margin.top,
        Math.min(top, bottom - this._fitInfo.sizedBy.minHeight));

      // Use right/bottom to set maxWidth/maxHeight, and respect minWidth/minHeight.
      this.sizingTarget.style.maxWidth = Math.max(right - left, this._fitInfo.sizedBy.minWidth) + 'px';
      this.sizingTarget.style.maxHeight = Math.max(bottom - top, this._fitInfo.sizedBy.minHeight) + 'px';

      // Remove the offset caused by any stacking context.
      this.style.left = (left - rect.left) + 'px';
      this.style.top = (top - rect.top) + 'px';
    },

    /**
     * Constrains the size of the element to `fitInto` by setting `max-height`
     * and/or `max-width`.
     */
    constrain: function() {
      if (this.horizontalAlign || this.verticalAlign) {
        return;
      }
      this._discoverInfo();

      var info = this._fitInfo;
      // position at (0px, 0px) if not already positioned, so we can measure the natural size.
      if (!info.positionedBy.vertically) {
        this.style.position = 'fixed';
        this.style.top = '0px';
      }
      if (!info.positionedBy.horizontally) {
        this.style.position = 'fixed';
        this.style.left = '0px';
      }

      // need border-box for margin/padding
      this.sizingTarget.style.boxSizing = 'border-box';
      // constrain the width and height if not already set
      var rect = this.getBoundingClientRect();
      if (!info.sizedBy.height) {
        this.__sizeDimension(rect, info.positionedBy.vertically, 'top', 'bottom', 'Height');
      }
      if (!info.sizedBy.width) {
        this.__sizeDimension(rect, info.positionedBy.horizontally, 'left', 'right', 'Width');
      }
    },

    /**
     * @protected
     * @deprecated
     */
    _sizeDimension: function(rect, positionedBy, start, end, extent) {
      this.__sizeDimension(rect, positionedBy, start, end, extent);
    },

    /**
     * @private
     */
    __sizeDimension: function(rect, positionedBy, start, end, extent) {
      var info = this._fitInfo;
      var fitRect = this.__getNormalizedRect(this.fitInto);
      var max = extent === 'Width' ? fitRect.width : fitRect.height;
      var flip = (positionedBy === end);
      var offset = flip ? max - rect[end] : rect[start];
      var margin = info.margin[flip ? start : end];
      var offsetExtent = 'offset' + extent;
      var sizingOffset = this[offsetExtent] - this.sizingTarget[offsetExtent];
      this.sizingTarget.style['max' + extent] = (max - margin - offset - sizingOffset) + 'px';
    },

    /**
     * Centers horizontally and vertically if not already positioned. This also sets
     * `position:fixed`.
     */
    center: function() {
      if (this.horizontalAlign || this.verticalAlign) {
        return;
      }
      this._discoverInfo();

      var positionedBy = this._fitInfo.positionedBy;
      if (positionedBy.vertically && positionedBy.horizontally) {
        // Already positioned.
        return;
      }
      // Need position:fixed to center
      this.style.position = 'fixed';
      // Take into account the offset caused by parents that create stacking
      // contexts (e.g. with transform: translate3d). Translate to 0,0 and
      // measure the bounding rect.
      if (!positionedBy.vertically) {
        this.style.top = '0px';
      }
      if (!positionedBy.horizontally) {
        this.style.left = '0px';
      }
      // It will take in consideration margins and transforms
      var rect = this.getBoundingClientRect();
      var fitRect = this.__getNormalizedRect(this.fitInto);
      if (!positionedBy.vertically) {
        var top = fitRect.top - rect.top + (fitRect.height - rect.height) / 2;
        this.style.top = top + 'px';
      }
      if (!positionedBy.horizontally) {
        var left = fitRect.left - rect.left + (fitRect.width - rect.width) / 2;
        this.style.left = left + 'px';
      }
    },

    __getNormalizedRect: function(target) {
      if (target === document.documentElement || target === window) {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          right: window.innerWidth,
          bottom: window.innerHeight
        };
      }
      return target.getBoundingClientRect();
    },

    __getCroppedArea: function(position, size, fitRect) {
      var verticalCrop = Math.min(0, position.top) + Math.min(0, fitRect.bottom - (position.top + size.height));
      var horizontalCrop = Math.min(0, position.left) + Math.min(0, fitRect.right - (position.left + size.width));
      return Math.abs(verticalCrop) * size.width + Math.abs(horizontalCrop) * size.height;
    },


    __getPosition: function(hAlign, vAlign, size, positionRect, fitRect) {
      // All the possible configurations.
      // Ordered as top-left, top-right, bottom-left, bottom-right.
      var positions = [{
        verticalAlign: 'top',
        horizontalAlign: 'left',
        top: positionRect.top + this.verticalOffset,
        left: positionRect.left + this.horizontalOffset
      }, {
        verticalAlign: 'top',
        horizontalAlign: 'right',
        top: positionRect.top + this.verticalOffset,
        left: positionRect.right - size.width - this.horizontalOffset
      }, {
        verticalAlign: 'bottom',
        horizontalAlign: 'left',
        top: positionRect.bottom - size.height - this.verticalOffset,
        left: positionRect.left + this.horizontalOffset
      }, {
        verticalAlign: 'bottom',
        horizontalAlign: 'right',
        top: positionRect.bottom - size.height - this.verticalOffset,
        left: positionRect.right - size.width - this.horizontalOffset
      }];

      if (this.noOverlap) {
        // Duplicate.
        for (var i = 0, l = positions.length; i < l; i++) {
          var copy = {};
          for (var key in positions[i]) {
            copy[key] = positions[i][key];
          }
          positions.push(copy);
        }
        // Horizontal overlap only.
        positions[0].top = positions[1].top += positionRect.height;
        positions[2].top = positions[3].top -= positionRect.height;
        // Vertical overlap only.
        positions[4].left = positions[6].left += positionRect.width;
        positions[5].left = positions[7].left -= positionRect.width;
      }

      // Consider auto as null for coding convenience.
      vAlign = vAlign === 'auto' ? null : vAlign;
      hAlign = hAlign === 'auto' ? null : hAlign;

      var position;
      for (var i = 0; i < positions.length; i++) {
        var pos = positions[i];

        // If both vAlign and hAlign are defined, return exact match.
        // For dynamicAlign and noOverlap we'll have more than one candidate, so
        // we'll have to check the croppedArea to make the best choice.
        if (!this.dynamicAlign && !this.noOverlap &&
          pos.verticalAlign === vAlign && pos.horizontalAlign === hAlign) {
          position = pos;
          break;
        }

        // Align is ok if alignment preferences are respected. If no preferences,
        // it is considered ok.
        var alignOk = (!vAlign || pos.verticalAlign === vAlign) &&
          (!hAlign || pos.horizontalAlign === hAlign);

        // Filter out elements that don't match the alignment (if defined).
        // With dynamicAlign, we need to consider all the positions to find the
        // one that minimizes the cropped area.
        if (!this.dynamicAlign && !alignOk) {
          continue;
        }

        position = position || pos;
        pos.croppedArea = this.__getCroppedArea(pos, size, fitRect);
        var diff = pos.croppedArea - position.croppedArea;
        // Check which crops less. If it crops equally, check if align is ok.
        if (diff < 0 || (diff === 0 && alignOk)) {
          position = pos;
        }
        // If not cropped and respects the align requirements, keep it.
        // This allows to prefer positions overlapping horizontally over the
        // ones overlapping vertically.
        if (position.croppedArea === 0 && alignOk) {
          break;
        }
      }

      return position;
    }

  };
/**
   * `IronResizableBehavior` is a behavior that can be used in Polymer elements to
   * coordinate the flow of resize events between "resizers" (elements that control the
   * size or hidden state of their children) and "resizables" (elements that need to be
   * notified when they are resized or un-hidden by their parents in order to take
   * action on their new measurements).
   *
   * Elements that perform measurement should add the `IronResizableBehavior` behavior to
   * their element definition and listen for the `iron-resize` event on themselves.
   * This event will be fired when they become showing after having been hidden,
   * when they are resized explicitly by another resizable, or when the window has been
   * resized.
   *
   * Note, the `iron-resize` event is non-bubbling.
   *
   * @polymerBehavior Polymer.IronResizableBehavior
   * @demo demo/index.html
   **/
  Polymer.IronResizableBehavior = {
    properties: {
      /**
       * The closest ancestor element that implements `IronResizableBehavior`.
       */
      _parentResizable: {
        type: Object,
        observer: '_parentResizableChanged'
      },

      /**
       * True if this element is currently notifying its descendant elements of
       * resize.
       */
      _notifyingDescendant: {
        type: Boolean,
        value: false
      }
    },

    listeners: {
      'iron-request-resize-notifications': '_onIronRequestResizeNotifications'
    },

    created: function() {
      // We don't really need property effects on these, and also we want them
      // to be created before the `_parentResizable` observer fires:
      this._interestedResizables = [];
      this._boundNotifyResize = this.notifyResize.bind(this);
    },

    attached: function() {
      this._requestResizeNotifications();
    },

    detached: function() {
      if (this._parentResizable) {
        this._parentResizable.stopResizeNotificationsFor(this);
      } else {
        window.removeEventListener('resize', this._boundNotifyResize);
      }

      this._parentResizable = null;
    },

    /**
     * Can be called to manually notify a resizable and its descendant
     * resizables of a resize change.
     */
    notifyResize: function() {
      if (!this.isAttached) {
        return;
      }

      this._interestedResizables.forEach(function(resizable) {
        if (this.resizerShouldNotify(resizable)) {
          this._notifyDescendant(resizable);
        }
      }, this);

      this._fireResize();
    },

    /**
     * Used to assign the closest resizable ancestor to this resizable
     * if the ancestor detects a request for notifications.
     */
    assignParentResizable: function(parentResizable) {
      this._parentResizable = parentResizable;
    },

    /**
     * Used to remove a resizable descendant from the list of descendants
     * that should be notified of a resize change.
     */
    stopResizeNotificationsFor: function(target) {
      var index = this._interestedResizables.indexOf(target);

      if (index > -1) {
        this._interestedResizables.splice(index, 1);
        this.unlisten(target, 'iron-resize', '_onDescendantIronResize');
      }
    },

    /**
     * This method can be overridden to filter nested elements that should or
     * should not be notified by the current element. Return true if an element
     * should be notified, or false if it should not be notified.
     *
     * @param {HTMLElement} element A candidate descendant element that
     * implements `IronResizableBehavior`.
     * @return {boolean} True if the `element` should be notified of resize.
     */
    resizerShouldNotify: function(element) { return true; },

    _onDescendantIronResize: function(event) {
      if (this._notifyingDescendant) {
        event.stopPropagation();
        return;
      }

      // NOTE(cdata): In ShadowDOM, event retargeting makes echoing of the
      // otherwise non-bubbling event "just work." We do it manually here for
      // the case where Polymer is not using shadow roots for whatever reason:
      if (!Polymer.Settings.useShadow) {
        this._fireResize();
      }
    },

    _fireResize: function() {
      this.fire('iron-resize', null, {
        node: this,
        bubbles: false
      });
    },

    _onIronRequestResizeNotifications: function(event) {
      var target = /** @type {!EventTarget} */ (Polymer.dom(event).rootTarget);
      if (target === this) {
        return;
      }

      if (this._interestedResizables.indexOf(target) === -1) {
        this._interestedResizables.push(target);
        this.listen(target, 'iron-resize', '_onDescendantIronResize');
      }

      target.assignParentResizable(this);
      this._notifyDescendant(target);

      event.stopPropagation();
    },

    _parentResizableChanged: function(parentResizable) {
      if (parentResizable) {
        window.removeEventListener('resize', this._boundNotifyResize);
      }
    },

    _notifyDescendant: function(descendant) {
      // NOTE(cdata): In IE10, attached is fired on children first, so it's
      // important not to notify them if the parent is not attached yet (or
      // else they will get redundantly notified when the parent attaches).
      if (!this.isAttached) {
        return;
      }

      this._notifyingDescendant = true;
      descendant.notifyResize();
      this._notifyingDescendant = false;
    },
    
    _requestResizeNotifications: function() {
      if (!this.isAttached)
        return;
      
      // NOTE(valdrin) In CustomElements v1 with native HTMLImports, the order
      // of imports affects the order of `attached` callbacks (see webcomponents/custom-elements#15).
      // This might cause a child to notify parents too early (as the parent
      // still has to be upgraded), resulting in a parent not able to keep track
      // of the `_interestedResizables`. To solve this, we wait for the document
      // to be done loading before firing the event.
      if (document.readyState === 'loading') {
        var _requestResizeNotifications = this._requestResizeNotifications.bind(this);
        document.addEventListener('readystatechange', function readystatechanged() {
          document.removeEventListener('readystatechange', readystatechanged);
          _requestResizeNotifications();
        });
      } else {
        this.fire('iron-request-resize-notifications', null, {
          node: this,
          bubbles: true,
          cancelable: true
        });

        if (!this._parentResizable) {
          window.addEventListener('resize', this._boundNotifyResize);
          this.notifyResize();
        } 
      }
    }
  };
(function() {
'use strict';

  Polymer({

    is: 'iron-overlay-backdrop',

    properties: {

      /**
       * Returns true if the backdrop is opened.
       */
      opened: {
        reflectToAttribute: true,
        type: Boolean,
        value: false,
        observer: '_openedChanged'
      }

    },

    listeners: {
      'transitionend': '_onTransitionend'
    },

    created: function() {
      // Used to cancel previous requestAnimationFrame calls when opened changes.
      this.__openedRaf = null;
    },

    attached: function() {
      this.opened && this._openedChanged(this.opened);
    },

    /**
     * Appends the backdrop to document body if needed.
     */
    prepare: function() {
      if (this.opened && !this.parentNode) {
        Polymer.dom(document.body).appendChild(this);
      }
    },

    /**
     * Shows the backdrop.
     */
    open: function() {
      this.opened = true;
    },

    /**
     * Hides the backdrop.
     */
    close: function() {
      this.opened = false;
    },

    /**
     * Removes the backdrop from document body if needed.
     */
    complete: function() {
      if (!this.opened && this.parentNode === document.body) {
        Polymer.dom(this.parentNode).removeChild(this);
      }
    },

    _onTransitionend: function(event) {
      if (event && event.target === this) {
        this.complete();
      }
    },

    /**
     * @param {boolean} opened
     * @private
     */
    _openedChanged: function(opened) {
      if (opened) {
        // Auto-attach.
        this.prepare();
      } else {
        // Animation might be disabled via the mixin or opacity custom property.
        // If it is disabled in other ways, it's up to the user to call complete.
        var cs = window.getComputedStyle(this);
        if (cs.transitionDuration === '0s' || cs.opacity == 0) {
          this.complete();
        }
      }

      if (!this.isAttached) {
        return;
      }

      // Always cancel previous requestAnimationFrame.
      if (this.__openedRaf) {
        window.cancelAnimationFrame(this.__openedRaf);
        this.__openedRaf = null;
      }
      // Force relayout to ensure proper transitions.
      this.scrollTop = this.scrollTop;
      this.__openedRaf = window.requestAnimationFrame(function() {
        this.__openedRaf = null;
        this.toggleClass('opened', this.opened);
      }.bind(this));
    }
  });

})();
/**
   * @struct
   * @constructor
   * @private
   */
  Polymer.IronOverlayManagerClass = function() {
    /**
     * Used to keep track of the opened overlays.
     * @private {Array<Element>}
     */
    this._overlays = [];

    /**
     * iframes have a default z-index of 100,
     * so this default should be at least that.
     * @private {number}
     */
    this._minimumZ = 101;

    /**
     * Memoized backdrop element.
     * @private {Element|null}
     */
    this._backdropElement = null;

    // Enable document-wide tap recognizer.
    // NOTE: Use useCapture=true to avoid accidentally prevention of the closing
    // of an overlay via event.stopPropagation(). The only way to prevent
    // closing of an overlay should be through its APIs.
    // NOTE: enable tap on <html> to workaround Polymer/polymer#4459
    Polymer.Gestures.add(document.documentElement, 'tap', null);
    document.addEventListener('tap', this._onCaptureClick.bind(this), true);
    document.addEventListener('focus', this._onCaptureFocus.bind(this), true);
    document.addEventListener('keydown', this._onCaptureKeyDown.bind(this), true);
  };

  Polymer.IronOverlayManagerClass.prototype = {

    constructor: Polymer.IronOverlayManagerClass,

    /**
     * The shared backdrop element.
     * @type {!Element} backdropElement
     */
    get backdropElement() {
      if (!this._backdropElement) {
        this._backdropElement = document.createElement('iron-overlay-backdrop');
      }
      return this._backdropElement;
    },

    /**
     * The deepest active element.
     * @type {!Element} activeElement the active element
     */
    get deepActiveElement() {
      // document.activeElement can be null
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
      // In case of null, default it to document.body.
      var active = document.activeElement || document.body;
      while (active.root && Polymer.dom(active.root).activeElement) {
        active = Polymer.dom(active.root).activeElement;
      }
      return active;
    },

    /**
     * Brings the overlay at the specified index to the front.
     * @param {number} i
     * @private
     */
    _bringOverlayAtIndexToFront: function(i) {
      var overlay = this._overlays[i];
      if (!overlay) {
        return;
      }
      var lastI = this._overlays.length - 1;
      var currentOverlay = this._overlays[lastI];
      // Ensure always-on-top overlay stays on top.
      if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
        lastI--;
      }
      // If already the top element, return.
      if (i >= lastI) {
        return;
      }
      // Update z-index to be on top.
      var minimumZ = Math.max(this.currentOverlayZ(), this._minimumZ);
      if (this._getZ(overlay) <= minimumZ) {
        this._applyOverlayZ(overlay, minimumZ);
      }

      // Shift other overlays behind the new on top.
      while (i < lastI) {
        this._overlays[i] = this._overlays[i + 1];
        i++;
      }
      this._overlays[lastI] = overlay;
    },

    /**
     * Adds the overlay and updates its z-index if it's opened, or removes it if it's closed.
     * Also updates the backdrop z-index.
     * @param {!Element} overlay
     */
    addOrRemoveOverlay: function(overlay) {
      if (overlay.opened) {
        this.addOverlay(overlay);
      } else {
        this.removeOverlay(overlay);
      }
    },

    /**
     * Tracks overlays for z-index and focus management.
     * Ensures the last added overlay with always-on-top remains on top.
     * @param {!Element} overlay
     */
    addOverlay: function(overlay) {
      var i = this._overlays.indexOf(overlay);
      if (i >= 0) {
        this._bringOverlayAtIndexToFront(i);
        this.trackBackdrop();
        return;
      }
      var insertionIndex = this._overlays.length;
      var currentOverlay = this._overlays[insertionIndex - 1];
      var minimumZ = Math.max(this._getZ(currentOverlay), this._minimumZ);
      var newZ = this._getZ(overlay);

      // Ensure always-on-top overlay stays on top.
      if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
        // This bumps the z-index of +2.
        this._applyOverlayZ(currentOverlay, minimumZ);
        insertionIndex--;
        // Update minimumZ to match previous overlay's z-index.
        var previousOverlay = this._overlays[insertionIndex - 1];
        minimumZ = Math.max(this._getZ(previousOverlay), this._minimumZ);
      }

      // Update z-index and insert overlay.
      if (newZ <= minimumZ) {
        this._applyOverlayZ(overlay, minimumZ);
      }
      this._overlays.splice(insertionIndex, 0, overlay);

      this.trackBackdrop();
    },

    /**
     * @param {!Element} overlay
     */
    removeOverlay: function(overlay) {
      var i = this._overlays.indexOf(overlay);
      if (i === -1) {
        return;
      }
      this._overlays.splice(i, 1);

      this.trackBackdrop();
    },

    /**
     * Returns the current overlay.
     * @return {Element|undefined}
     */
    currentOverlay: function() {
      var i = this._overlays.length - 1;
      return this._overlays[i];
    },

    /**
     * Returns the current overlay z-index.
     * @return {number}
     */
    currentOverlayZ: function() {
      return this._getZ(this.currentOverlay());
    },

    /**
     * Ensures that the minimum z-index of new overlays is at least `minimumZ`.
     * This does not effect the z-index of any existing overlays.
     * @param {number} minimumZ
     */
    ensureMinimumZ: function(minimumZ) {
      this._minimumZ = Math.max(this._minimumZ, minimumZ);
    },

    focusOverlay: function() {
      var current = /** @type {?} */ (this.currentOverlay());
      if (current) {
        current._applyFocus();
      }
    },

    /**
     * Updates the backdrop z-index.
     */
    trackBackdrop: function() {
      var overlay = this._overlayWithBackdrop();
      // Avoid creating the backdrop if there is no overlay with backdrop.
      if (!overlay && !this._backdropElement) {
        return;
      }
      this.backdropElement.style.zIndex = this._getZ(overlay) - 1;
      this.backdropElement.opened = !!overlay;
      // Property observers are not fired until element is attached
      // in Polymer 2.x, so we ensure element is attached if needed.
      // https://github.com/Polymer/polymer/issues/4526
      this.backdropElement.prepare();
    },

    /**
     * @return {Array<Element>}
     */
    getBackdrops: function() {
      var backdrops = [];
      for (var i = 0; i < this._overlays.length; i++) {
        if (this._overlays[i].withBackdrop) {
          backdrops.push(this._overlays[i]);
        }
      }
      return backdrops;
    },

    /**
     * Returns the z-index for the backdrop.
     * @return {number}
     */
    backdropZ: function() {
      return this._getZ(this._overlayWithBackdrop()) - 1;
    },

    /**
     * Returns the first opened overlay that has a backdrop.
     * @return {Element|undefined}
     * @private
     */
    _overlayWithBackdrop: function() {
      for (var i = 0; i < this._overlays.length; i++) {
        if (this._overlays[i].withBackdrop) {
          return this._overlays[i];
        }
      }
    },

    /**
     * Calculates the minimum z-index for the overlay.
     * @param {Element=} overlay
     * @private
     */
    _getZ: function(overlay) {
      var z = this._minimumZ;
      if (overlay) {
        var z1 = Number(overlay.style.zIndex || window.getComputedStyle(overlay).zIndex);
        // Check if is a number
        // Number.isNaN not supported in IE 10+
        if (z1 === z1) {
          z = z1;
        }
      }
      return z;
    },

    /**
     * @param {!Element} element
     * @param {number|string} z
     * @private
     */
    _setZ: function(element, z) {
      element.style.zIndex = z;
    },

    /**
     * @param {!Element} overlay
     * @param {number} aboveZ
     * @private
     */
    _applyOverlayZ: function(overlay, aboveZ) {
      this._setZ(overlay, aboveZ + 2);
    },

    /**
     * Returns the deepest overlay in the path.
     * @param {Array<Element>=} path
     * @return {Element|undefined}
     * @suppress {missingProperties}
     * @private
     */
    _overlayInPath: function(path) {
      path = path || [];
      for (var i = 0; i < path.length; i++) {
        if (path[i]._manager === this) {
          return path[i];
        }
      }
    },

    /**
     * Ensures the click event is delegated to the right overlay.
     * @param {!Event} event
     * @private
     */
    _onCaptureClick: function(event) {
      var overlay = /** @type {?} */ (this.currentOverlay());
      // Check if clicked outside of top overlay.
      if (overlay && this._overlayInPath(Polymer.dom(event).path) !== overlay) {
        overlay._onCaptureClick(event);
      }
    },

    /**
     * Ensures the focus event is delegated to the right overlay.
     * @param {!Event} event
     * @private
     */
    _onCaptureFocus: function(event) {
      var overlay = /** @type {?} */ (this.currentOverlay());
      if (overlay) {
        overlay._onCaptureFocus(event);
      }
    },

    /**
     * Ensures TAB and ESC keyboard events are delegated to the right overlay.
     * @param {!Event} event
     * @private
     */
    _onCaptureKeyDown: function(event) {
      var overlay = /** @type {?} */ (this.currentOverlay());
      if (overlay) {
        if (Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'esc')) {
          overlay._onCaptureEsc(event);
        } else if (Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'tab')) {
          overlay._onCaptureTab(event);
        }
      }
    },

    /**
     * Returns if the overlay1 should be behind overlay2.
     * @param {!Element} overlay1
     * @param {!Element} overlay2
     * @return {boolean}
     * @suppress {missingProperties}
     * @private
     */
    _shouldBeBehindOverlay: function(overlay1, overlay2) {
      return !overlay1.alwaysOnTop && overlay2.alwaysOnTop;
    }
  };

  Polymer.IronOverlayManager = new Polymer.IronOverlayManagerClass();
(function() {
    'use strict';

    var p = Element.prototype;
    var matches = p.matches || p.matchesSelector || p.mozMatchesSelector ||
      p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;

    Polymer.IronFocusablesHelper = {

      /**
       * Returns a sorted array of tabbable nodes, including the root node.
       * It searches the tabbable nodes in the light and shadow dom of the chidren,
       * sorting the result by tabindex.
       * @param {!Node} node
       * @return {Array<HTMLElement>}
       */
      getTabbableNodes: function(node) {
        var result = [];
        // If there is at least one element with tabindex > 0, we need to sort
        // the final array by tabindex.
        var needsSortByTabIndex = this._collectTabbableNodes(node, result);
        if (needsSortByTabIndex) {
          return this._sortByTabIndex(result);
        }
        return result;
      },

      /**
       * Returns if a element is focusable.
       * @param {!HTMLElement} element
       * @return {boolean}
       */
      isFocusable: function(element) {
        // From http://stackoverflow.com/a/1600194/4228703:
        // There isn't a definite list, it's up to the browser. The only
        // standard we have is DOM Level 2 HTML https://www.w3.org/TR/DOM-Level-2-HTML/html.html,
        // according to which the only elements that have a focus() method are
        // HTMLInputElement,  HTMLSelectElement, HTMLTextAreaElement and
        // HTMLAnchorElement. This notably omits HTMLButtonElement and
        // HTMLAreaElement.
        // Referring to these tests with tabbables in different browsers
        // http://allyjs.io/data-tables/focusable.html

        // Elements that cannot be focused if they have [disabled] attribute.
        if (matches.call(element, 'input, select, textarea, button, object')) {
          return matches.call(element, ':not([disabled])');
        }
        // Elements that can be focused even if they have [disabled] attribute.
        return matches.call(element,
          'a[href], area[href], iframe, [tabindex], [contentEditable]');
      },

      /**
       * Returns if a element is tabbable. To be tabbable, a element must be
       * focusable, visible, and with a tabindex !== -1.
       * @param {!HTMLElement} element
       * @return {boolean}
       */
      isTabbable: function(element) {
        return this.isFocusable(element) &&
          matches.call(element, ':not([tabindex="-1"])') &&
          this._isVisible(element);
      },

      /**
       * Returns the normalized element tabindex. If not focusable, returns -1.
       * It checks for the attribute "tabindex" instead of the element property
       * `tabIndex` since browsers assign different values to it.
       * e.g. in Firefox `<div contenteditable>` has `tabIndex = -1`
       * @param {!HTMLElement} element
       * @return {!number}
       * @private
       */
      _normalizedTabIndex: function(element) {
        if (this.isFocusable(element)) {
          var tabIndex = element.getAttribute('tabindex') || 0;
          return Number(tabIndex);
        }
        return -1;
      },

      /**
       * Searches for nodes that are tabbable and adds them to the `result` array.
       * Returns if the `result` array needs to be sorted by tabindex.
       * @param {!Node} node The starting point for the search; added to `result`
       * if tabbable.
       * @param {!Array<HTMLElement>} result
       * @return {boolean}
       * @private
       */
      _collectTabbableNodes: function(node, result) {
        // If not an element or not visible, no need to explore children.
        if (node.nodeType !== Node.ELEMENT_NODE || !this._isVisible(node)) {
          return false;
        }
        var element = /** @type {HTMLElement} */ (node);
        var tabIndex = this._normalizedTabIndex(element);
        var needsSort = tabIndex > 0;
        if (tabIndex >= 0) {
          result.push(element);
        }

        // In ShadowDOM v1, tab order is affected by the order of distrubution.
        // E.g. getTabbableNodes(#root) in ShadowDOM v1 should return [#A, #B];
        // in ShadowDOM v0 tab order is not affected by the distrubution order,
        // in fact getTabbableNodes(#root) returns [#B, #A].
        //  <div id="root">
        //   <!-- shadow -->
        //     <slot name="a">
        //     <slot name="b">
        //   <!-- /shadow -->
        //   <input id="A" slot="a">
        //   <input id="B" slot="b" tabindex="1">
        //  </div>
        // TODO(valdrin) support ShadowDOM v1 when upgrading to Polymer v2.0.
        var children;
        if (element.localName === 'content' || element.localName === 'slot') {
          children = Polymer.dom(element).getDistributedNodes();
        } else {
          // Use shadow root if possible, will check for distributed nodes.
          children = Polymer.dom(element.root || element).children;
        }
        for (var i = 0; i < children.length; i++) {
          // Ensure method is always invoked to collect tabbable children.
          needsSort = this._collectTabbableNodes(children[i], result) || needsSort;
        }
        return needsSort;
      },

      /**
       * Returns false if the element has `visibility: hidden` or `display: none`
       * @param {!HTMLElement} element
       * @return {boolean}
       * @private
       */
      _isVisible: function(element) {
        // Check inline style first to save a re-flow. If looks good, check also
        // computed style.
        var style = element.style;
        if (style.visibility !== 'hidden' && style.display !== 'none') {
          style = window.getComputedStyle(element);
          return (style.visibility !== 'hidden' && style.display !== 'none');
        }
        return false;
      },

      /**
       * Sorts an array of tabbable elements by tabindex. Returns a new array.
       * @param {!Array<HTMLElement>} tabbables
       * @return {Array<HTMLElement>}
       * @private
       */
      _sortByTabIndex: function(tabbables) {
        // Implement a merge sort as Array.prototype.sort does a non-stable sort
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
        var len = tabbables.length;
        if (len < 2) {
          return tabbables;
        }
        var pivot = Math.ceil(len / 2);
        var left = this._sortByTabIndex(tabbables.slice(0, pivot));
        var right = this._sortByTabIndex(tabbables.slice(pivot));
        return this._mergeSortByTabIndex(left, right);
      },

      /**
       * Merge sort iterator, merges the two arrays into one, sorted by tab index.
       * @param {!Array<HTMLElement>} left
       * @param {!Array<HTMLElement>} right
       * @return {Array<HTMLElement>}
       * @private
       */
      _mergeSortByTabIndex: function(left, right) {
        var result = [];
        while ((left.length > 0) && (right.length > 0)) {
          if (this._hasLowerTabOrder(left[0], right[0])) {
            result.push(right.shift());
          } else {
            result.push(left.shift());
          }
        }

        return result.concat(left, right);
      },

      /**
       * Returns if element `a` has lower tab order compared to element `b`
       * (both elements are assumed to be focusable and tabbable).
       * Elements with tabindex = 0 have lower tab order compared to elements
       * with tabindex > 0.
       * If both have same tabindex, it returns false.
       * @param {!HTMLElement} a
       * @param {!HTMLElement} b
       * @return {boolean}
       * @private
       */
      _hasLowerTabOrder: function(a, b) {
        // Normalize tabIndexes
        // e.g. in Firefox `<div contenteditable>` has `tabIndex = -1`
        var ati = Math.max(a.tabIndex, 0);
        var bti = Math.max(b.tabIndex, 0);
        return (ati === 0 || bti === 0) ? bti > ati : ati > bti;
      }
    };
  })();
(function() {
  'use strict';

  /** @polymerBehavior */
  Polymer.IronOverlayBehaviorImpl = {

    properties: {

      /**
       * True if the overlay is currently displayed.
       */
      opened: {
        observer: '_openedChanged',
        type: Boolean,
        value: false,
        notify: true
      },

      /**
       * True if the overlay was canceled when it was last closed.
       */
      canceled: {
        observer: '_canceledChanged',
        readOnly: true,
        type: Boolean,
        value: false
      },

      /**
       * Set to true to display a backdrop behind the overlay. It traps the focus
       * within the light DOM of the overlay.
       */
      withBackdrop: {
        observer: '_withBackdropChanged',
        type: Boolean
      },

      /**
       * Set to true to disable auto-focusing the overlay or child nodes with
       * the `autofocus` attribute` when the overlay is opened.
       */
      noAutoFocus: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to disable canceling the overlay with the ESC key.
       */
      noCancelOnEscKey: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to disable canceling the overlay by clicking outside it.
       */
      noCancelOnOutsideClick: {
        type: Boolean,
        value: false
      },

      /**
       * Contains the reason(s) this overlay was last closed (see `iron-overlay-closed`).
       * `IronOverlayBehavior` provides the `canceled` reason; implementers of the
       * behavior can provide other reasons in addition to `canceled`.
       */
      closingReason: {
        // was a getter before, but needs to be a property so other
        // behaviors can override this.
        type: Object
      },

      /**
       * Set to true to enable restoring of focus when overlay is closed.
       */
      restoreFocusOnClose: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to keep overlay always on top.
       */
      alwaysOnTop: {
        type: Boolean
      },

      /**
       * Shortcut to access to the overlay manager.
       * @private
       * @type {Polymer.IronOverlayManagerClass}
       */
      _manager: {
        type: Object,
        value: Polymer.IronOverlayManager
      },

      /**
       * The node being focused.
       * @type {?Node}
       */
      _focusedChild: {
        type: Object
      }

    },

    listeners: {
      'iron-resize': '_onIronResize'
    },

    /**
     * The backdrop element.
     * @type {Element}
     */
    get backdropElement() {
      return this._manager.backdropElement;
    },

    /**
     * Returns the node to give focus to.
     * @type {Node}
     */
    get _focusNode() {
      return this._focusedChild || Polymer.dom(this).querySelector('[autofocus]') || this;
    },

    /**
     * Array of nodes that can receive focus (overlay included), ordered by `tabindex`.
     * This is used to retrieve which is the first and last focusable nodes in order
     * to wrap the focus for overlays `with-backdrop`.
     *
     * If you know what is your content (specifically the first and last focusable children),
     * you can override this method to return only `[firstFocusable, lastFocusable];`
     * @type {Array<Node>}
     * @protected
     */
    get _focusableNodes() {
      return Polymer.IronFocusablesHelper.getTabbableNodes(this);
    },

    ready: function() {
      // Used to skip calls to notifyResize and refit while the overlay is animating.
      this.__isAnimating = false;
      // with-backdrop needs tabindex to be set in order to trap the focus.
      // If it is not set, IronOverlayBehavior will set it, and remove it if with-backdrop = false.
      this.__shouldRemoveTabIndex = false;
      // Used for wrapping the focus on TAB / Shift+TAB.
      this.__firstFocusableNode = this.__lastFocusableNode = null;
      // Used by __onNextAnimationFrame to cancel any previous callback.
      this.__raf = null;
      // Focused node before overlay gets opened. Can be restored on close.
      this.__restoreFocusNode = null;
      this._ensureSetup();
    },

    attached: function() {
      // Call _openedChanged here so that position can be computed correctly.
      if (this.opened) {
        this._openedChanged(this.opened);
      }
      this._observer = Polymer.dom(this).observeNodes(this._onNodesChange);
    },

    detached: function() {
      Polymer.dom(this).unobserveNodes(this._observer);
      this._observer = null;
      if (this.__raf) {
        window.cancelAnimationFrame(this.__raf);
        this.__raf = null;
      }
      this._manager.removeOverlay(this);
    },

    /**
     * Toggle the opened state of the overlay.
     */
    toggle: function() {
      this._setCanceled(false);
      this.opened = !this.opened;
    },

    /**
     * Open the overlay.
     */
    open: function() {
      this._setCanceled(false);
      this.opened = true;
    },

    /**
     * Close the overlay.
     */
    close: function() {
      this._setCanceled(false);
      this.opened = false;
    },

    /**
     * Cancels the overlay.
     * @param {Event=} event The original event
     */
    cancel: function(event) {
      var cancelEvent = this.fire('iron-overlay-canceled', event, {cancelable: true});
      if (cancelEvent.defaultPrevented) {
        return;
      }

      this._setCanceled(true);
      this.opened = false;
    },

    /**
     * Invalidates the cached tabbable nodes. To be called when any of the focusable
     * content changes (e.g. a button is disabled).
     */
    invalidateTabbables: function() {
      this.__firstFocusableNode = this.__lastFocusableNode = null;
    },

    _ensureSetup: function() {
      if (this._overlaySetup) {
        return;
      }
      this._overlaySetup = true;
      this.style.outline = 'none';
      this.style.display = 'none';
    },

    /**
     * Called when `opened` changes.
     * @param {boolean=} opened
     * @protected
     */
    _openedChanged: function(opened) {
      if (opened) {
        this.removeAttribute('aria-hidden');
      } else {
        this.setAttribute('aria-hidden', 'true');
      }

      // Defer any animation-related code on attached
      // (_openedChanged gets called again on attached).
      if (!this.isAttached) {
        return;
      }

      this.__isAnimating = true;

      // Use requestAnimationFrame for non-blocking rendering.
      this.__onNextAnimationFrame(this.__openedChanged);
    },

    _canceledChanged: function() {
      this.closingReason = this.closingReason || {};
      this.closingReason.canceled = this.canceled;
    },

    _withBackdropChanged: function() {
      // If tabindex is already set, no need to override it.
      if (this.withBackdrop && !this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '-1');
        this.__shouldRemoveTabIndex = true;
      } else if (this.__shouldRemoveTabIndex) {
        this.removeAttribute('tabindex');
        this.__shouldRemoveTabIndex = false;
      }
      if (this.opened && this.isAttached) {
        this._manager.trackBackdrop();
      }
    },

    /**
     * tasks which must occur before opening; e.g. making the element visible.
     * @protected
     */
    _prepareRenderOpened: function() {
      // Store focused node.
      this.__restoreFocusNode = this._manager.deepActiveElement;

      // Needed to calculate the size of the overlay so that transitions on its size
      // will have the correct starting points.
      this._preparePositioning();
      this.refit();
      this._finishPositioning();

      // Safari will apply the focus to the autofocus element when displayed
      // for the first time, so we make sure to return the focus where it was.
      if (this.noAutoFocus && document.activeElement === this._focusNode) {
        this._focusNode.blur();
        this.__restoreFocusNode.focus();
      }
    },

    /**
     * Tasks which cause the overlay to actually open; typically play an animation.
     * @protected
     */
    _renderOpened: function() {
      this._finishRenderOpened();
    },

    /**
     * Tasks which cause the overlay to actually close; typically play an animation.
     * @protected
     */
    _renderClosed: function() {
      this._finishRenderClosed();
    },

    /**
     * Tasks to be performed at the end of open action. Will fire `iron-overlay-opened`.
     * @protected
     */
    _finishRenderOpened: function() {
      this.notifyResize();
      this.__isAnimating = false;

      this.fire('iron-overlay-opened');
    },

    /**
     * Tasks to be performed at the end of close action. Will fire `iron-overlay-closed`.
     * @protected
     */
    _finishRenderClosed: function() {
      // Hide the overlay.
      this.style.display = 'none';
      // Reset z-index only at the end of the animation.
      this.style.zIndex = '';
      this.notifyResize();
      this.__isAnimating = false;
      this.fire('iron-overlay-closed', this.closingReason);
    },

    _preparePositioning: function() {
      this.style.transition = this.style.webkitTransition = 'none';
      this.style.transform = this.style.webkitTransform = 'none';
      this.style.display = '';
    },

    _finishPositioning: function() {
      // First, make it invisible & reactivate animations.
      this.style.display = 'none';
      // Force reflow before re-enabling animations so that they don't start.
      // Set scrollTop to itself so that Closure Compiler doesn't remove this.
      this.scrollTop = this.scrollTop;
      this.style.transition = this.style.webkitTransition = '';
      this.style.transform = this.style.webkitTransform = '';
      // Now that animations are enabled, make it visible again
      this.style.display = '';
      // Force reflow, so that following animations are properly started.
      // Set scrollTop to itself so that Closure Compiler doesn't remove this.
      this.scrollTop = this.scrollTop;
    },

    /**
     * Applies focus according to the opened state.
     * @protected
     */
    _applyFocus: function() {
      if (this.opened) {
        if (!this.noAutoFocus) {
          this._focusNode.focus();
        }
      }
      else {
        this._focusNode.blur();
        this._focusedChild = null;
        // Restore focus.
        if (this.restoreFocusOnClose && this.__restoreFocusNode) {
          this.__restoreFocusNode.focus();
        }
        this.__restoreFocusNode = null;
        // If many overlays get closed at the same time, one of them would still
        // be the currentOverlay even if already closed, and would call _applyFocus
        // infinitely, so we check for this not to be the current overlay.
        var currentOverlay = this._manager.currentOverlay();
        if (currentOverlay && this !== currentOverlay) {
          currentOverlay._applyFocus();
        }
      }
    },

    /**
     * Cancels (closes) the overlay. Call when click happens outside the overlay.
     * @param {!Event} event
     * @protected
     */
    _onCaptureClick: function(event) {
      if (!this.noCancelOnOutsideClick) {
        this.cancel(event);
      }
    },

    /**
     * Keeps track of the focused child. If withBackdrop, traps focus within overlay.
     * @param {!Event} event
     * @protected
     */
    _onCaptureFocus: function (event) {
      if (!this.withBackdrop) {
        return;
      }
      var path = Polymer.dom(event).path;
      if (path.indexOf(this) === -1) {
        event.stopPropagation();
        this._applyFocus();
      } else {
        this._focusedChild = path[0];
      }
    },

    /**
     * Handles the ESC key event and cancels (closes) the overlay.
     * @param {!Event} event
     * @protected
     */
    _onCaptureEsc: function(event) {
      if (!this.noCancelOnEscKey) {
        this.cancel(event);
      }
    },

    /**
     * Handles TAB key events to track focus changes.
     * Will wrap focus for overlays withBackdrop.
     * @param {!Event} event
     * @protected
     */
    _onCaptureTab: function(event) {
      if (!this.withBackdrop) {
        return;
      }
      this.__ensureFirstLastFocusables();
      // TAB wraps from last to first focusable.
      // Shift + TAB wraps from first to last focusable.
      var shift = event.shiftKey;
      var nodeToCheck = shift ? this.__firstFocusableNode : this.__lastFocusableNode;
      var nodeToSet = shift ? this.__lastFocusableNode : this.__firstFocusableNode;
      var shouldWrap = false;
      if (nodeToCheck === nodeToSet) {
        // If nodeToCheck is the same as nodeToSet, it means we have an overlay
        // with 0 or 1 focusables; in either case we still need to trap the
        // focus within the overlay.
        shouldWrap = true;
      } else {
        // In dom=shadow, the manager will receive focus changes on the main
        // root but not the ones within other shadow roots, so we can't rely on
        // _focusedChild, but we should check the deepest active element.
        var focusedNode = this._manager.deepActiveElement;
        // If the active element is not the nodeToCheck but the overlay itself,
        // it means the focus is about to go outside the overlay, hence we
        // should prevent that (e.g. user opens the overlay and hit Shift+TAB).
        shouldWrap = (focusedNode === nodeToCheck || focusedNode === this);
      }

      if (shouldWrap) {
        // When the overlay contains the last focusable element of the document
        // and it's already focused, pressing TAB would move the focus outside
        // the document (e.g. to the browser search bar). Similarly, when the
        // overlay contains the first focusable element of the document and it's
        // already focused, pressing Shift+TAB would move the focus outside the
        // document (e.g. to the browser search bar).
        // In both cases, we would not receive a focus event, but only a blur.
        // In order to achieve focus wrapping, we prevent this TAB event and
        // force the focus. This will also prevent the focus to temporarily move
        // outside the overlay, which might cause scrolling.
        event.preventDefault();
        this._focusedChild = nodeToSet;
        this._applyFocus();
      }
    },

    /**
     * Refits if the overlay is opened and not animating.
     * @protected
     */
    _onIronResize: function() {
      if (this.opened && !this.__isAnimating) {
        this.__onNextAnimationFrame(this.refit);
      }
    },

    /**
     * Will call notifyResize if overlay is opened.
     * Can be overridden in order to avoid multiple observers on the same node.
     * @protected
     */
    _onNodesChange: function() {
      if (this.opened && !this.__isAnimating) {
        // It might have added focusable nodes, so invalidate cached values.
        this.invalidateTabbables();
        this.notifyResize();
      }
    },

    /**
     * Will set first and last focusable nodes if any of them is not set.
     * @private
     */
    __ensureFirstLastFocusables: function() {
      if (!this.__firstFocusableNode || !this.__lastFocusableNode) {
        var focusableNodes = this._focusableNodes;
        this.__firstFocusableNode = focusableNodes[0];
        this.__lastFocusableNode = focusableNodes[focusableNodes.length - 1];
      }
    },

    /**
     * Tasks executed when opened changes: prepare for the opening, move the
     * focus, update the manager, render opened/closed.
     * @private
     */
    __openedChanged: function() {
      if (this.opened) {
        // Make overlay visible, then add it to the manager.
        this._prepareRenderOpened();
        this._manager.addOverlay(this);
        // Move the focus to the child node with [autofocus].
        this._applyFocus();

        this._renderOpened();
      } else {
        // Remove overlay, then restore the focus before actually closing.
        this._manager.removeOverlay(this);
        this._applyFocus();

        this._renderClosed();
      }
    },

    /**
     * Executes a callback on the next animation frame, overriding any previous
     * callback awaiting for the next animation frame. e.g.
     * `__onNextAnimationFrame(callback1) && __onNextAnimationFrame(callback2)`;
     * `callback1` will never be invoked.
     * @param {!Function} callback Its `this` parameter is the overlay itself.
     * @private
     */
    __onNextAnimationFrame: function(callback) {
      if (this.__raf) {
        window.cancelAnimationFrame(this.__raf);
      }
      var self = this;
      this.__raf = window.requestAnimationFrame(function nextAnimationFrame() {
        self.__raf = null;
        callback.call(self);
      });
    }

  };

  /**
  Use `Polymer.IronOverlayBehavior` to implement an element that can be hidden or shown, and displays
  on top of other content. It includes an optional backdrop, and can be used to implement a variety
  of UI controls including dialogs and drop downs. Multiple overlays may be displayed at once.

  See the [demo source code](https://github.com/PolymerElements/iron-overlay-behavior/blob/master/demo/simple-overlay.html)
  for an example.

  ### Closing and canceling

  An overlay may be hidden by closing or canceling. The difference between close and cancel is user
  intent. Closing generally implies that the user acknowledged the content on the overlay. By default,
  it will cancel whenever the user taps outside it or presses the escape key. This behavior is
  configurable with the `no-cancel-on-esc-key` and the `no-cancel-on-outside-click` properties.
  `close()` should be called explicitly by the implementer when the user interacts with a control
  in the overlay element. When the dialog is canceled, the overlay fires an 'iron-overlay-canceled'
  event. Call `preventDefault` on this event to prevent the overlay from closing.

  ### Positioning

  By default the element is sized and positioned to fit and centered inside the window. You can
  position and size it manually using CSS. See `Polymer.IronFitBehavior`.

  ### Backdrop

  Set the `with-backdrop` attribute to display a backdrop behind the overlay. The backdrop is
  appended to `<body>` and is of type `<iron-overlay-backdrop>`. See its doc page for styling
  options.

  In addition, `with-backdrop` will wrap the focus within the content in the light DOM.
  Override the [`_focusableNodes` getter](#Polymer.IronOverlayBehavior:property-_focusableNodes)
  to achieve a different behavior.

  ### Limitations

  The element is styled to appear on top of other content by setting its `z-index` property. You
  must ensure no element has a stacking context with a higher `z-index` than its parent stacking
  context. You should place this element as a child of `<body>` whenever possible.

  @demo demo/index.html
  @polymerBehavior
  */
  Polymer.IronOverlayBehavior = [Polymer.IronFitBehavior, Polymer.IronResizableBehavior, Polymer.IronOverlayBehaviorImpl];

  /**
   * Fired after the overlay opens.
   * @event iron-overlay-opened
   */

  /**
   * Fired when the overlay is canceled, but before it is closed.
   * @event iron-overlay-canceled
   * @param {Event} event The closing of the overlay can be prevented
   * by calling `event.preventDefault()`. The `event.detail` is the original event that
   * originated the canceling (e.g. ESC keyboard event or click event outside the overlay).
   */

  /**
   * Fired after the overlay closes.
   * @event iron-overlay-closed
   * @param {Event} event The `event.detail` is the `closingReason` property
   * (contains `canceled`, whether the overlay was canceled).
   */

})();
(function() {
'use strict';

/**
Use `Polymer.PaperDialogBehavior` and `paper-dialog-shared-styles.html` to implement a Material Design
dialog.

For example, if `<paper-dialog-impl>` implements this behavior:

    <paper-dialog-impl>
        <h2>Header</h2>
        <div>Dialog body</div>
        <div class="buttons">
            <paper-button dialog-dismiss>Cancel</paper-button>
            <paper-button dialog-confirm>Accept</paper-button>
        </div>
    </paper-dialog-impl>

`paper-dialog-shared-styles.html` provide styles for a header, content area, and an action area for buttons.
Use the `<h2>` tag for the header and the `buttons` class for the action area. You can use the
`paper-dialog-scrollable` element (in its own repository) if you need a scrolling content area.

Use the `dialog-dismiss` and `dialog-confirm` attributes on interactive controls to close the
dialog. If the user dismisses the dialog with `dialog-confirm`, the `closingReason` will update
to include `confirmed: true`.

### Accessibility

This element has `role="dialog"` by default. Depending on the context, it may be more appropriate
to override this attribute with `role="alertdialog"`.

If `modal` is set, the element will prevent the focus from exiting the element.
It will also ensure that focus remains in the dialog.

@hero hero.svg
@demo demo/index.html
@polymerBehavior Polymer.PaperDialogBehavior
*/
  Polymer.PaperDialogBehaviorImpl = {

    hostAttributes: {
      'role': 'dialog',
      'tabindex': '-1'
    },

    properties: {

      /**
       * If `modal` is true, this implies `no-cancel-on-outside-click`, `no-cancel-on-esc-key` and `with-backdrop`.
       */
      modal: {
        type: Boolean,
        value: false
      },

      __readied: {
        type: Boolean,
        value: false
      }

    },

    observers: [
      '_modalChanged(modal, __readied)'
    ],

    listeners: {
      'tap': '_onDialogClick'
    },

    ready: function() {
      // Only now these properties can be read.
      this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick;
      this.__prevNoCancelOnEscKey = this.noCancelOnEscKey;
      this.__prevWithBackdrop = this.withBackdrop;
      this.__readied = true;
    },

    _modalChanged: function(modal, readied) {
      // modal implies noCancelOnOutsideClick, noCancelOnEscKey and withBackdrop.
      // We need to wait for the element to be ready before we can read the
      // properties values.
      if (!readied) {
        return;
      }

      if (modal) {
        this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick;
        this.__prevNoCancelOnEscKey = this.noCancelOnEscKey;
        this.__prevWithBackdrop = this.withBackdrop;
        this.noCancelOnOutsideClick = true;
        this.noCancelOnEscKey = true;
        this.withBackdrop = true;
      } else {
        // If the value was changed to false, let it false.
        this.noCancelOnOutsideClick = this.noCancelOnOutsideClick &&
          this.__prevNoCancelOnOutsideClick;
        this.noCancelOnEscKey = this.noCancelOnEscKey &&
          this.__prevNoCancelOnEscKey;
        this.withBackdrop = this.withBackdrop && this.__prevWithBackdrop;
      }
    },

    _updateClosingReasonConfirmed: function(confirmed) {
      this.closingReason = this.closingReason || {};
      this.closingReason.confirmed = confirmed;
    },

    /**
     * Will dismiss the dialog if user clicked on an element with dialog-dismiss
     * or dialog-confirm attribute.
     */
    _onDialogClick: function(event) {
      // Search for the element with dialog-confirm or dialog-dismiss,
      // from the root target until this (excluded).
      var path = Polymer.dom(event).path;
      for (var i = 0, l = path.indexOf(this); i < l; i++) {
        var target = path[i];
        if (target.hasAttribute && (target.hasAttribute('dialog-dismiss') || target.hasAttribute('dialog-confirm'))) {
          this._updateClosingReasonConfirmed(target.hasAttribute('dialog-confirm'));
          this.close();
          event.stopPropagation();
          break;
        }
      }
    }

  };

  /** @polymerBehavior */
  Polymer.PaperDialogBehavior = [Polymer.IronOverlayBehavior, Polymer.PaperDialogBehaviorImpl];

})();
(function() {
'use strict';

  Polymer({

    is: 'paper-dialog',

    behaviors: [
      Polymer.PaperDialogBehavior,
      Polymer.NeonAnimationRunnerBehavior
    ],

    listeners: {
      'neon-animation-finish': '_onNeonAnimationFinish'
    },

    _renderOpened: function() {
      this.cancelAnimation();
      this.playAnimation('entry');
    },

    _renderClosed: function() {
      this.cancelAnimation();
      this.playAnimation('exit');
    },

    _onNeonAnimationFinish: function() {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        this._finishRenderClosed();
      }
    }

  });

})();
Polymer({

    is: 'paper-dialog-scrollable',

    properties: {

      /**
       * The dialog element that implements `Polymer.PaperDialogBehavior` containing this element.
       * @type {?Node}
       */
      dialogElement: {
        type: Object
      }

    },

    /**
     * Returns the scrolling element.
     */
    get scrollTarget() {
      return this.$.scrollable;
    },

    ready: function () {
      this._ensureTarget();
      this.classList.add('no-padding');
    },

    attached: function() {
      this._ensureTarget();
      requestAnimationFrame(this.updateScrollState.bind(this));
    },

    updateScrollState: function() {
      this.toggleClass('is-scrolled', this.scrollTarget.scrollTop > 0);
      this.toggleClass('can-scroll', this.scrollTarget.offsetHeight < this.scrollTarget.scrollHeight);
      this.toggleClass('scrolled-to-bottom',
        this.scrollTarget.scrollTop + this.scrollTarget.offsetHeight >= this.scrollTarget.scrollHeight);
    },

    _ensureTarget: function () {
      // Read parentElement instead of parentNode in order to skip shadowRoots.
      this.dialogElement = this.dialogElement || this.parentElement;
      // Check if dialog implements paper-dialog-behavior. If not, fit scrollTarget to host.
      if (this.dialogElement && this.dialogElement.behaviors &&
          this.dialogElement.behaviors.indexOf(Polymer.PaperDialogBehaviorImpl) >= 0) {
        this.dialogElement.sizingTarget = this.scrollTarget;
        this.scrollTarget.classList.remove('fit');
      } else if (this.dialogElement) {
        this.scrollTarget.classList.add('fit');
      }
    }

  });
(function() {
      'use strict';

      Polymer.IronA11yAnnouncer = Polymer({
        is: 'iron-a11y-announcer',

        properties: {

          /**
           * The value of mode is used to set the `aria-live` attribute
           * for the element that will be announced. Valid values are: `off`,
           * `polite` and `assertive`.
           */
          mode: {
            type: String,
            value: 'polite'
          },

          _text: {
            type: String,
            value: ''
          }
        },

        created: function() {
          if (!Polymer.IronA11yAnnouncer.instance) {
            Polymer.IronA11yAnnouncer.instance = this;
          }

          document.body.addEventListener('iron-announce', this._onIronAnnounce.bind(this));
        },

        /**
         * Cause a text string to be announced by screen readers.
         *
         * @param {string} text The text that should be announced.
         */
        announce: function(text) {
          this._text = '';
          this.async(function() {
            this._text = text;
          }, 100);
        },

        _onIronAnnounce: function(event) {
          if (event.detail && event.detail.text) {
            this.announce(event.detail.text);
          }
        }
      });

      Polymer.IronA11yAnnouncer.instance = null;

      Polymer.IronA11yAnnouncer.requestAvailability = function() {
        if (!Polymer.IronA11yAnnouncer.instance) {
          Polymer.IronA11yAnnouncer.instance = document.createElement('iron-a11y-announcer');
        }

        document.body.appendChild(Polymer.IronA11yAnnouncer.instance);
      };
    })();
Polymer({
      is: 'iron-input',

      behaviors: [
        Polymer.IronValidatableBehavior
      ],

      /**
       * Fired whenever `validate()` is called.
       *
       * @event iron-input-validate
       */

      properties: {

        /**
         * Use this property instead of `value` for two-way data binding, or to
         * set a default value for the input. **Do not** use the distributed
         * input's `value` property to set a default value.
         */
        bindValue: {
          type: String
        },

        /**
         * Computed property that echoes `bindValue` (mostly used for Polymer 1.0
         * backcompatibility, if you were one-way binding to the Polymer 1.0
         * `input is="iron-input"` value attribute).
         */
        value: {
          computed: '_computeValue(bindValue)'
        },

        /**
         * Regex-like list of characters allowed as input; all characters not in the list
         * will be rejected. The recommended format should be a list of allowed characters,
         * for example, `[a-zA-Z0-9.+-!;:]`.
         *
         * This pattern represents the allowed characters for the field; as the user inputs text,
         * each individual character will be checked against the pattern (rather than checking
         * the entire value as a whole). If a character is not a match, it will be rejected.
         *
         * Pasted input will have each character checked individually; if any character
         * doesn't match `allowedPattern`, the entire pasted string will be rejected.
         *
         * Note: if you were using `iron-input` in 1.0, you were also required to
         * set `prevent-invalid-input`. This is no longer needed as of Polymer 2.0,
         * and will be set automatically for you if an `allowedPattern` is provided.
         *
         */
        allowedPattern: {
          type: String
        },

        /**
         * Set to true to auto-validate the input value as you type.
         */
        autoValidate: {
          type: Boolean,
          value: false
        }
      },

      observers: [
        '_bindValueChanged(bindValue, _inputElement)'
      ],

      listeners: {
        'input': '_onInput',
        'keypress': '_onKeypress'
      },

      created: function() {
        Polymer.IronA11yAnnouncer.requestAvailability();
        this._previousValidInput = '';
        this._patternAlreadyChecked = false;
      },

      attached: function() {
        // If the input is added at a later time, update the internal reference.
        this._observer = Polymer.dom(this).observeNodes(function(info) {
          this._initSlottedInput();
        }.bind(this));
      },

      detached: function() {
        if (this._observer) {
          Polymer.dom(this).unobserveNodes(this._observer);
          this._observer = null;
        }
      },

      /**
       * Returns the distributed <input> element.
       */
      get inputElement () {
        return this._inputElement;
      },

      _initSlottedInput: function() {
        this._inputElement = this.getEffectiveChildren()[0];

        if (this.inputElement && this.inputElement.value) {
          this.bindValue = this.inputElement.value;
        }

        this.fire('iron-input-ready');
      },

      get _patternRegExp() {
        var pattern;
        if (this.allowedPattern) {
          pattern = new RegExp(this.allowedPattern);
        } else {
          switch (this.type) {
            case 'number':
              pattern = /[0-9.,e-]/;
              break;
          }
        }
        return pattern;
      },

      /**
       * @suppress {checkTypes}
       */
      _bindValueChanged: function(bindValue, inputElement) {
        // The observer could have run before attached() when we have actually initialized
        // this property.
        if (!inputElement) {
          return;
        }

        if (bindValue === undefined) {
          inputElement.value = null;
        } else if (bindValue !== inputElement.value){
          this.inputElement.value = bindValue;
        }

        if (this.autoValidate) {
          this.validate();
        }

        // manually notify because we don't want to notify until after setting value
        this.fire('bind-value-changed', {value: bindValue});
      },

      _onInput: function() {
        // Need to validate each of the characters pasted if they haven't
        // been validated inside `_onKeypress` already.
        if (this.allowedPattern && !this._patternAlreadyChecked) {
          var valid = this._checkPatternValidity();
          if (!valid) {
            this._announceInvalidCharacter('Invalid string of characters not entered.');
            this.inputElement.value = this._previousValidInput;
          }
        }
        this.bindValue = this._previousValidInput = this.inputElement.value;
        this._patternAlreadyChecked = false;
      },

      _isPrintable: function(event) {
        // What a control/printable character is varies wildly based on the browser.
        // - most control characters (arrows, backspace) do not send a `keypress` event
        //   in Chrome, but the *do* on Firefox
        // - in Firefox, when they do send a `keypress` event, control chars have
        //   a charCode = 0, keyCode = xx (for ex. 40 for down arrow)
        // - printable characters always send a keypress event.
        // - in Firefox, printable chars always have a keyCode = 0. In Chrome, the keyCode
        //   always matches the charCode.
        // None of this makes any sense.

        // For these keys, ASCII code == browser keycode.
        var anyNonPrintable =
          (event.keyCode == 8)   ||  // backspace
          (event.keyCode == 9)   ||  // tab
          (event.keyCode == 13)  ||  // enter
          (event.keyCode == 27);     // escape

        // For these keys, make sure it's a browser keycode and not an ASCII code.
        var mozNonPrintable =
          (event.keyCode == 19)  ||  // pause
          (event.keyCode == 20)  ||  // caps lock
          (event.keyCode == 45)  ||  // insert
          (event.keyCode == 46)  ||  // delete
          (event.keyCode == 144) ||  // num lock
          (event.keyCode == 145) ||  // scroll lock
          (event.keyCode > 32 && event.keyCode < 41)   || // page up/down, end, home, arrows
          (event.keyCode > 111 && event.keyCode < 124); // fn keys

        return !anyNonPrintable && !(event.charCode == 0 && mozNonPrintable);
      },

      _onKeypress: function(event) {
        if (!this.allowedPattern && this.type !== 'number') {
          return;
        }
        var regexp = this._patternRegExp;
        if (!regexp) {
          return;
        }

        // Handle special keys and backspace
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        // Check the pattern either here or in `_onInput`, but not in both.
        this._patternAlreadyChecked = true;

        var thisChar = String.fromCharCode(event.charCode);
        if (this._isPrintable(event) && !regexp.test(thisChar)) {
          event.preventDefault();
          this._announceInvalidCharacter('Invalid character ' + thisChar + ' not entered.');
        }
      },

      _checkPatternValidity: function() {
        var regexp = this._patternRegExp;
        if (!regexp) {
          return true;
        }
        for (var i = 0; i < this.inputElement.value.length; i++) {
          if (!regexp.test(this.inputElement.value[i])) {
            return false;
          }
        }
        return true;
      },

      /**
       * Returns true if `value` is valid. The validator provided in `validator` will be used first,
       * then any constraints.
       * @return {boolean} True if the value is valid.
       */
      validate: function() {
        if (!this.inputElement) {
          this.invalid = false;
          return true;
        }

        // Use the nested input's native validity.
        var valid =  this.inputElement.checkValidity();

        // Only do extra checking if the browser thought this was valid.
        if (valid) {
          // Empty, required input is invalid
          if (this.required && this.bindValue === '') {
            valid = false;
          } else if (this.hasValidator()) {
            valid = Polymer.IronValidatableBehavior.validate.call(this, this.bindValue);
          }
        }

        this.invalid = !valid;
        this.fire('iron-input-validate');
        return valid;
      },

      _announceInvalidCharacter: function(message) {
        this.fire('iron-announce', { text: message });
      },

      _computeValue: function(bindValue) {
        return bindValue;
      }
    });
// Generate unique, monotonically increasing IDs for labels (needed by
  // aria-labelledby) and add-ons.
  Polymer.PaperInputHelper = {};
  Polymer.PaperInputHelper.NextLabelID = 1;
  Polymer.PaperInputHelper.NextAddonID = 1;

  /**
   * Use `Polymer.PaperInputBehavior` to implement inputs with `<paper-input-container>`. This
   * behavior is implemented by `<paper-input>`. It exposes a number of properties from
   * `<paper-input-container>` and `<input is="iron-input">` and they should be bound in your
   * template.
   *
   * The input element can be accessed by the `inputElement` property if you need to access
   * properties or methods that are not exposed.
   * @polymerBehavior Polymer.PaperInputBehavior
   */
  Polymer.PaperInputBehaviorImpl = {

    properties: {
      /**
       * Fired when the input changes due to user interaction.
       *
       * @event change
       */

      /**
       * The label for this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * `<label>`'s content and `hidden` property, e.g.
       * `<label hidden$="[[!label]]">[[label]]</label>` in your `template`
       */
      label: {
        type: String
      },

      /**
       * The value for this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<iron-input>`'s `bindValue`
       * property, or the value property of your input that is `notify:true`.
       */
      value: {
        notify: true,
        type: String
      },

      /**
       * Set to true to disable this input. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * both the `<paper-input-container>`'s and the input's `disabled` property.
       */
      disabled: {
        type: Boolean,
        value: false
      },

      /**
       * Returns true if the value is invalid. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to both the
       * `<paper-input-container>`'s and the input's `invalid` property.
       *
       * If `autoValidate` is true, the `invalid` attribute is managed automatically,
       * which can clobber attempts to manage it manually.
       */
      invalid: {
        type: Boolean,
        value: false,
        notify: true
      },

      /**
       * Set this to specify the pattern allowed by `preventInvalidInput`. If
       * you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `allowedPattern`
       * property.
       */
      allowedPattern: {
        type: String
      },

      /**
       * The type of the input. The supported types are `text`, `number` and `password`.
       * If you're using PaperInputBehavior to implement your own paper-input-like element,
       * bind this to the `<input is="iron-input">`'s `type` property.
       */
      type: {
        type: String
      },

      /**
       * The datalist of the input (if any). This should match the id of an existing `<datalist>`.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `list` property.
       */
      list: {
        type: String
      },

      /**
       * A pattern to validate the `input` with. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `pattern` property.
       */
      pattern: {
        type: String
      },

      /**
       * Set to true to mark the input as required. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `required` property.
       */
      required: {
        type: Boolean,
        value: false
      },

      /**
       * The error message to display when the input is invalid. If you're using
       * PaperInputBehavior to implement your own paper-input-like element,
       * bind this to the `<paper-input-error>`'s content, if using.
       */
      errorMessage: {
        type: String
      },

      /**
       * Set to true to show a character counter.
       */
      charCounter: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to disable the floating label. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `noLabelFloat` property.
       */
      noLabelFloat: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to always float the label. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `alwaysFloatLabel` property.
       */
      alwaysFloatLabel: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to auto-validate the input value. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<paper-input-container>`'s `autoValidate` property.
       */
      autoValidate: {
        type: Boolean,
        value: false
      },

      /**
       * Name of the validator to use. If you're using PaperInputBehavior to
       * implement your own paper-input-like element, bind this to
       * the `<input is="iron-input">`'s `validator` property.
       */
      validator: {
        type: String
      },

      // HTMLInputElement attributes for binding if needed

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocomplete` property.
       */
      autocomplete: {
        type: String,
        value: 'off'
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autofocus` property.
       */
      autofocus: {
        type: Boolean,
        observer: '_autofocusChanged'
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `inputmode` property.
       */
      inputmode: {
        type: String
      },

      /**
       * The minimum length of the input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `minlength` property.
       */
      minlength: {
        type: Number
      },

      /**
       * The maximum length of the input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `maxlength` property.
       */
      maxlength: {
        type: Number
      },

      /**
       * The minimum (numeric or date-time) input value.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `min` property.
       */
      min: {
        type: String
      },

      /**
       * The maximum (numeric or date-time) input value.
       * Can be a String (e.g. `"2000-01-01"`) or a Number (e.g. `2`).
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `max` property.
       */
      max: {
        type: String
      },

      /**
       * Limits the numeric or date-time increments.
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `step` property.
       */
      step: {
        type: String
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `name` property.
       */
      name: {
        type: String
      },

      /**
       * A placeholder string in addition to the label. If this is set, the label will always float.
       */
      placeholder: {
        type: String,
        // need to set a default so _computeAlwaysFloatLabel is run
        value: ''
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `readonly` property.
       */
      readonly: {
        type: Boolean,
        value: false
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `size` property.
       */
      size: {
        type: Number
      },

      // Nonstandard attributes for binding if needed

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocapitalize` property.
       */
      autocapitalize: {
        type: String,
        value: 'none'
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autocorrect` property.
       */
      autocorrect: {
        type: String,
        value: 'off'
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `autosave` property,
       * used with type=search.
       */
      autosave: {
        type: String
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `results` property,
       * used with type=search.
       */
      results: {
        type: Number
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the `<input is="iron-input">`'s `accept` property,
       * used with type=file.
       */
      accept: {
        type: String
      },

      /**
       * If you're using PaperInputBehavior to implement your own paper-input-like
       * element, bind this to the`<input is="iron-input">`'s `multiple` property,
       * used with type=file.
       */
      multiple: {
        type: Boolean
      },

      _ariaDescribedBy: {
        type: String,
        value: ''
      },

      _ariaLabelledBy: {
        type: String,
        value: ''
      }

    },

    listeners: {
      'addon-attached': '_onAddonAttached',
    },

    keyBindings: {
      'shift+tab:keydown': '_onShiftTabDown'
    },

    hostAttributes: {
      tabindex: 0
    },

    /**
     * Returns a reference to the input element.
     */
    get inputElement() {
      return this.$.input;
    },

    /**
     * Returns a reference to the focusable element.
     */
    get _focusableElement() {
      return this.inputElement;
    },

    created: function() {
      // These types have some default placeholder text; overlapping
      // the label on top of it looks terrible. Auto-float the label in this case.
      this._typesThatHaveText = ["date", "datetime", "datetime-local", "month",
          "time", "week", "file"];
    },

    attached: function() {
      this._updateAriaLabelledBy();

      // In the 2.0 version of the element, this is handled in `onIronInputReady`,
      // i.e. after the native input has finished distributing. In the 1.0 version,
      // the input is in the shadow tree, so it's already available.
      if (!Polymer.Element && this.inputElement &&
          this._typesThatHaveText.indexOf(this.inputElement.type) !== -1) {
        this.alwaysFloatLabel = true;
      }
    },

    _appendStringWithSpace: function(str, more) {
      if (str) {
        str = str + ' ' + more;
      } else {
        str = more;
      }
      return str;
    },

    _onAddonAttached: function(event) {
      var target = Polymer.dom(event).rootTarget;
      if (target.id) {
        this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, target.id);
      } else {
        var id = 'paper-input-add-on-' + Polymer.PaperInputHelper.NextAddonID++;
        target.id = id;
        this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, id);
      }
    },

    /**
     * Validates the input element and sets an error style if needed.
     *
     * @return {boolean}
     */
    validate: function() {
      return this.inputElement.validate();
    },

    /**
     * Forward focus to inputElement. Overriden from IronControlState.
     */
    _focusBlurHandler: function(event) {
      Polymer.IronControlState._focusBlurHandler.call(this, event);

      // Forward the focus to the nested input.
      if (this.focused && !this._shiftTabPressed && this._focusableElement) {
        this._focusableElement.focus();
      }
    },

    /**
     * Handler that is called when a shift+tab keypress is detected by the menu.
     *
     * @param {CustomEvent} event A key combination event.
     */
    _onShiftTabDown: function(event) {
      var oldTabIndex = this.getAttribute('tabindex');
      this._shiftTabPressed = true;
      this.setAttribute('tabindex', '-1');
      this.async(function() {
        this.setAttribute('tabindex', oldTabIndex);
        this._shiftTabPressed = false;
      }, 1);
    },

    /**
     * If `autoValidate` is true, then validates the element.
     */
    _handleAutoValidate: function() {
      if (this.autoValidate)
        this.validate();
    },

    /**
     * Restores the cursor to its original position after updating the value.
     * @param {string} newValue The value that should be saved.
     */
    updateValueAndPreserveCaret: function(newValue) {
      // Not all elements might have selection, and even if they have the
      // right properties, accessing them might throw an exception (like for
      // <input type=number>)
      try {
        var start = this.inputElement.selectionStart;
        this.value = newValue;

        // The cursor automatically jumps to the end after re-setting the value,
        // so restore it to its original position.
        this.inputElement.selectionStart = start;
        this.inputElement.selectionEnd = start;
      } catch (e) {
        // Just set the value and give up on the caret.
        this.value = newValue;
      }
    },

    _computeAlwaysFloatLabel: function(alwaysFloatLabel, placeholder) {
      return placeholder || alwaysFloatLabel;
    },

    _updateAriaLabelledBy: function() {
      var label = Polymer.dom(this.root).querySelector('label');
      if (!label) {
        this._ariaLabelledBy = '';
        return;
      }
      var labelledBy;
      if (label.id) {
        labelledBy = label.id;
      } else {
        labelledBy = 'paper-input-label-' + Polymer.PaperInputHelper.NextLabelID++;
        label.id = labelledBy;
      }
      this._ariaLabelledBy = labelledBy;
    },

    _onChange:function(event) {
      // In the Shadow DOM, the `change` event is not leaked into the
      // ancestor tree, so we must do this manually.
      // See https://w3c.github.io/webcomponents/spec/shadow/#events-that-are-not-leaked-into-ancestor-trees.
      if (this.shadowRoot) {
        this.fire(event.type, {sourceEvent: event}, {
          node: this,
          bubbles: event.bubbles,
          cancelable: event.cancelable
        });
      }
    },

    _autofocusChanged: function() {
      // Firefox doesn't respect the autofocus attribute if it's applied after
      // the page is loaded (Chrome/WebKit do respect it), preventing an
      // autofocus attribute specified in markup from taking effect when the
      // element is upgraded. As a workaround, if the autofocus property is set,
      // and the focus hasn't already been moved elsewhere, we take focus.
      if (this.autofocus && this._focusableElement) {

        // In IE 11, the default document.activeElement can be the page's
        // outermost html element, but there are also cases (under the
        // polyfill?) in which the activeElement is not a real HTMLElement, but
        // just a plain object. We identify the latter case as having no valid
        // activeElement.
        var activeElement = document.activeElement;
        var isActiveElementValid = activeElement instanceof HTMLElement;

        // Has some other element has already taken the focus?
        var isSomeElementActive = isActiveElementValid &&
            activeElement !== document.body &&
            activeElement !== document.documentElement; /* IE 11 */
        if (!isSomeElementActive) {
          // No specific element has taken the focus yet, so we can take it.
          this._focusableElement.focus();
        }
      }
    }
  };

  /** @polymerBehavior */
  Polymer.PaperInputBehavior = [
    Polymer.IronControlState,
    Polymer.IronA11yKeysBehavior,
    Polymer.PaperInputBehaviorImpl
  ];
/**
   * Use `Polymer.PaperInputAddonBehavior` to implement an add-on for `<paper-input-container>`. A
   * add-on appears below the input, and may display information based on the input value and
   * validity such as a character counter or an error message.
   * @polymerBehavior
   */
  Polymer.PaperInputAddonBehavior = {
    attached: function() {
      // Workaround for https://github.com/webcomponents/shadydom/issues/96
      Polymer.dom.flush();
      this.fire('addon-attached');
    },

    /**
     * The function called by `<paper-input-container>` when the input value or validity changes.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */
    update: function(state) {
    }

  };
Polymer({
    is: 'paper-input-char-counter',

    behaviors: [
      Polymer.PaperInputAddonBehavior
    ],

    properties: {
      _charCounterStr: {
        type: String,
        value: '0'
      }
    },

    /**
     * This overrides the update function in PaperInputAddonBehavior.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */
    update: function(state) {
      if (!state.inputElement) {
        return;
      }

      state.value = state.value || '';

      var counter = state.value.toString().length.toString();

      if (state.inputElement.hasAttribute('maxlength')) {
        counter += '/' + state.inputElement.getAttribute('maxlength');
      }

      this._charCounterStr = counter;
    }
  });
Polymer({
    is: 'paper-input-container',

    properties: {
      /**
       * Set to true to disable the floating label. The label disappears when the input value is
       * not null.
       */
      noLabelFloat: {
        type: Boolean,
        value: false
      },

      /**
       * Set to true to always float the floating label.
       */
      alwaysFloatLabel: {
        type: Boolean,
        value: false
      },

      /**
       * The attribute to listen for value changes on.
       */
      attrForValue: {
        type: String,
        value: 'bind-value'
      },

      /**
       * Set to true to auto-validate the input value when it changes.
       */
      autoValidate: {
        type: Boolean,
        value: false
      },

      /**
       * True if the input is invalid. This property is set automatically when the input value
       * changes if auto-validating, or when the `iron-input-validate` event is heard from a child.
       */
      invalid: {
        observer: '_invalidChanged',
        type: Boolean,
        value: false
      },

      /**
       * True if the input has focus.
       */
      focused: {
        readOnly: true,
        type: Boolean,
        value: false,
        notify: true
      },

      _addons: {
        type: Array
        // do not set a default value here intentionally - it will be initialized lazily when a
        // distributed child is attached, which may occur before configuration for this element
        // in polyfill.
      },

      _inputHasContent: {
        type: Boolean,
        value: false
      },

      _inputSelector: {
        type: String,
        value: 'input,iron-input,textarea,.paper-input-input'
      },

      _boundOnFocus: {
        type: Function,
        value: function() {
          return this._onFocus.bind(this);
        }
      },

      _boundOnBlur: {
        type: Function,
        value: function() {
          return this._onBlur.bind(this);
        }
      },

      _boundOnInput: {
        type: Function,
        value: function() {
          return this._onInput.bind(this);
        }
      },

      _boundValueChanged: {
        type: Function,
        value: function() {
          return this._onValueChanged.bind(this);
        }
      }
    },

    listeners: {
      'addon-attached': '_onAddonAttached',
      'iron-input-validate': '_onIronInputValidate'
    },

    get _valueChangedEvent() {
      return this.attrForValue + '-changed';
    },

    get _propertyForValue() {
      return Polymer.CaseMap.dashToCamelCase(this.attrForValue);
    },

    get _inputElement() {
      return Polymer.dom(this).querySelector(this._inputSelector);
    },

    get _inputElementValue() {
      return this._inputElement[this._propertyForValue] || this._inputElement.value;
    },

    ready: function() {
      if (!this._addons) {
        this._addons = [];
      }
      this.addEventListener('focus', this._boundOnFocus, true);
      this.addEventListener('blur', this._boundOnBlur, true);
    },

    attached: function() {
      if (this.attrForValue) {
        this._inputElement.addEventListener(this._valueChangedEvent, this._boundValueChanged);
      } else {
        this.addEventListener('input', this._onInput);
      }

      // Only validate when attached if the input already has a value.
      if (this._inputElementValue && this._inputElementValue != '') {
        this._handleValueAndAutoValidate(this._inputElement);
      } else {
        this._handleValue(this._inputElement);
      }
    },

    _onAddonAttached: function(event) {
      if (!this._addons) {
        this._addons = [];
      }
      var target = event.target;
      if (this._addons.indexOf(target) === -1) {
        this._addons.push(target);
        if (this.isAttached) {
          this._handleValue(this._inputElement);
        }
      }
    },

    _onFocus: function() {
      this._setFocused(true);
    },

    _onBlur: function() {
      this._setFocused(false);
      this._handleValueAndAutoValidate(this._inputElement);
    },

    _onInput: function(event) {
      this._handleValueAndAutoValidate(event.target);
    },

    _onValueChanged: function(event) {
      var input = event.target;

      // Problem: if the input is required but has no text entered, we should
      // only validate it on blur (so that an empty form doesn't come up red
      // immediately; however, in this handler, we don't know whether this is
      // the booting up value or a value in the future. I am assuming that the
      // case  we care about manifests itself when the value is undefined.
      // If this causes future problems, we need to do something like track whether
      // the iron-input-ready event has fired, and this handler came before that.

      if (input.value === undefined) {
        return;
      }

      this._handleValueAndAutoValidate(event.target);
    },

    _handleValue: function(inputElement) {
      var value = this._inputElementValue;

      // type="number" hack needed because this.value is empty until it's valid
      if (value || value === 0 || (inputElement.type === 'number' && !inputElement.checkValidity())) {
        this._inputHasContent = true;
      } else {
        this._inputHasContent = false;
      }

      this.updateAddons({
        inputElement: inputElement,
        value: value,
        invalid: this.invalid
      });
    },

    _handleValueAndAutoValidate: function(inputElement) {
      if (this.autoValidate && inputElement) {
        var valid;

        if (inputElement.validate) {
          valid = inputElement.validate(this._inputElementValue);
        } else {
          valid = inputElement.checkValidity();
        }
        this.invalid = !valid;
      }

      // Call this last to notify the add-ons.
      this._handleValue(inputElement);
    },

    _onIronInputValidate: function(event) {
      this.invalid = this._inputElement.invalid;
    },

    _invalidChanged: function() {
      if (this._addons) {
        this.updateAddons({invalid: this.invalid});
      }
    },

    /**
     * Call this to update the state of add-ons.
     * @param {Object} state Add-on state.
     */
    updateAddons: function(state) {
      for (var addon, index = 0; addon = this._addons[index]; index++) {
        addon.update(state);
      }
    },

    _computeInputContentClass: function(noLabelFloat, alwaysFloatLabel, focused, invalid, _inputHasContent) {
      var cls = 'input-content';
      if (!noLabelFloat) {
        var label = this.querySelector('label');

        if (alwaysFloatLabel || _inputHasContent) {
          cls += ' label-is-floating';
          // If the label is floating, ignore any offsets that may have been
          // applied from a prefix element.
          this.$.labelAndInputContainer.style.position = 'static';

          if (invalid) {
            cls += ' is-invalid';
          } else if (focused) {
            cls += " label-is-highlighted";
          }
        } else {
          // When the label is not floating, it should overlap the input element.
          if (label) {
            this.$.labelAndInputContainer.style.position = 'relative';
          }
          if (invalid) {
            cls += ' is-invalid';
          }
        }
      } else {
        if (_inputHasContent) {
          cls += ' label-is-hidden';
        }
        if (invalid) {
          cls += ' is-invalid';
        }
      }
      if (focused) {
        cls += ' focused';
      }
      return cls;
    },

    _computeUnderlineClass: function(focused, invalid) {
      var cls = 'underline';
      if (invalid) {
        cls += ' is-invalid';
      } else if (focused) {
        cls += ' is-highlighted'
      }
      return cls;
    },

    _computeAddOnContentClass: function(focused, invalid) {
      var cls = 'add-on-content';
      if (invalid) {
        cls += ' is-invalid';
      } else if (focused) {
        cls += ' is-highlighted'
      }
      return cls;
    }
  });
Polymer({
    is: 'paper-input-error',

    behaviors: [
      Polymer.PaperInputAddonBehavior
    ],

    properties: {
      /**
       * True if the error is showing.
       */
      invalid: {
        readOnly: true,
        reflectToAttribute: true,
        type: Boolean
      }
    },

    /**
     * This overrides the update function in PaperInputAddonBehavior.
     * @param {{
     *   inputElement: (Element|undefined),
     *   value: (string|undefined),
     *   invalid: boolean
     * }} state -
     *     inputElement: The input element.
     *     value: The input value.
     *     invalid: True if the input value is invalid.
     */
    update: function(state) {
      this._setInvalid(state.invalid);
    }
  });
Polymer({
    is: 'paper-input',

    behaviors: [
      Polymer.PaperInputBehavior,
      Polymer.IronFormElementBehavior
    ],

    beforeRegister: function() {
      // We need to tell which kind of of template to stamp based on
      // what kind of `iron-input` we got, but because of polyfills and
      // custom elements differences between v0 and v1, the safest bet is
      // to check a particular method we know the iron-input#2.x can have.
      // If it doesn't have it, then it's an iron-input#1.x.
      var ironInput = document.createElement('iron-input');
      var version = typeof ironInput._initSlottedInput == 'function' ? 'v1' : 'v0';
      var template = Polymer.DomModule.import('paper-input', 'template');
      var inputTemplate = Polymer.DomModule.import('paper-input', 'template#' + version);
      var inputPlaceholder = template.content.querySelector('#template-placeholder');
      if (inputPlaceholder) {
        inputPlaceholder.parentNode.replaceChild(inputTemplate.content, inputPlaceholder);
      }
      // else it's already been processed, probably in superclass
    },

    /**
     * Returns a reference to the focusable element. Overridden from PaperInputBehavior
     * to correctly focus the native input.
     */
    get _focusableElement() {
      return Polymer.Element ? this.inputElement._inputElement : this.inputElement;
    },

    // Note: This event is only available in the 1.0 version of this element.
    // In 2.0, the functionality of `_onIronInputReady` is done in
    // PaperInputBehavior::attached.
    listeners: {
      'iron-input-ready': '_onIronInputReady'
    },

    _onIronInputReady: function() {
      if (this.inputElement &&
          this._typesThatHaveText.indexOf(this.$.nativeInput.type) !== -1) {
        this.alwaysFloatLabel = true;
      }

      // Only validate when attached if the input already has a value.
      if (!!this.inputElement.bindValue) {
        this.$.container._handleValueAndAutoValidate(this.inputElement);
      }
    },
  });
(function() {
    'use strict';
    /**
     * Used to calculate the scroll direction during touch events.
     * @type {!Object}
     */
    var lastTouchPosition = {
      pageX: 0,
      pageY: 0
    };
    /**
     * Used to avoid computing event.path and filter scrollable nodes (better perf).
     * @type {?EventTarget}
     */
    var lastRootTarget = null;
    /**
     * @type {!Array<Node>}
     */
    var lastScrollableNodes = [];

    var scrollEvents = [
      // Modern `wheel` event for mouse wheel scrolling:
      'wheel',
      // Older, non-standard `mousewheel` event for some FF:
      'mousewheel',
      // IE:
      'DOMMouseScroll',
      // Touch enabled devices
      'touchstart',
      'touchmove'
    ];

    /**
     * The IronDropdownScrollManager is intended to provide a central source
     * of authority and control over which elements in a document are currently
     * allowed to scroll.
     */

    Polymer.IronDropdownScrollManager = {

      /**
       * The current element that defines the DOM boundaries of the
       * scroll lock. This is always the most recently locking element.
       */
      get currentLockingElement() {
        return this._lockingElements[this._lockingElements.length - 1];
      },

      /**
       * Returns true if the provided element is "scroll locked", which is to
       * say that it cannot be scrolled via pointer or keyboard interactions.
       *
       * @param {HTMLElement} element An HTML element instance which may or may
       * not be scroll locked.
       */
      elementIsScrollLocked: function(element) {
        var currentLockingElement = this.currentLockingElement;

        if (currentLockingElement === undefined)
          return false;

        var scrollLocked;

        if (this._hasCachedLockedElement(element)) {
          return true;
        }

        if (this._hasCachedUnlockedElement(element)) {
          return false;
        }

        scrollLocked = !!currentLockingElement &&
          currentLockingElement !== element &&
          !this._composedTreeContains(currentLockingElement, element);

        if (scrollLocked) {
          this._lockedElementCache.push(element);
        } else {
          this._unlockedElementCache.push(element);
        }

        return scrollLocked;
      },

      /**
       * Push an element onto the current scroll lock stack. The most recently
       * pushed element and its children will be considered scrollable. All
       * other elements will not be scrollable.
       *
       * Scroll locking is implemented as a stack so that cases such as
       * dropdowns within dropdowns are handled well.
       *
       * @param {HTMLElement} element The element that should lock scroll.
       */
      pushScrollLock: function(element) {
        // Prevent pushing the same element twice
        if (this._lockingElements.indexOf(element) >= 0) {
          return;
        }

        if (this._lockingElements.length === 0) {
          this._lockScrollInteractions();
        }

        this._lockingElements.push(element);

        this._lockedElementCache = [];
        this._unlockedElementCache = [];
      },

      /**
       * Remove an element from the scroll lock stack. The element being
       * removed does not need to be the most recently pushed element. However,
       * the scroll lock constraints only change when the most recently pushed
       * element is removed.
       *
       * @param {HTMLElement} element The element to remove from the scroll
       * lock stack.
       */
      removeScrollLock: function(element) {
        var index = this._lockingElements.indexOf(element);

        if (index === -1) {
          return;
        }

        this._lockingElements.splice(index, 1);

        this._lockedElementCache = [];
        this._unlockedElementCache = [];

        if (this._lockingElements.length === 0) {
          this._unlockScrollInteractions();
        }
      },

      _lockingElements: [],

      _lockedElementCache: null,

      _unlockedElementCache: null,

      _hasCachedLockedElement: function(element) {
        return this._lockedElementCache.indexOf(element) > -1;
      },

      _hasCachedUnlockedElement: function(element) {
        return this._unlockedElementCache.indexOf(element) > -1;
      },

      _composedTreeContains: function(element, child) {
        // NOTE(cdata): This method iterates over content elements and their
        // corresponding distributed nodes to implement a contains-like method
        // that pierces through the composed tree of the ShadowDOM. Results of
        // this operation are cached (elsewhere) on a per-scroll-lock basis, to
        // guard against potentially expensive lookups happening repeatedly as
        // a user scrolls / touchmoves.
        var contentElements;
        var distributedNodes;
        var contentIndex;
        var nodeIndex;

        if (element.contains(child)) {
          return true;
        }

        contentElements = Polymer.dom(element).querySelectorAll('content,slot');

        for (contentIndex = 0; contentIndex < contentElements.length; ++contentIndex) {

          distributedNodes = Polymer.dom(contentElements[contentIndex]).getDistributedNodes();

          for (nodeIndex = 0; nodeIndex < distributedNodes.length; ++nodeIndex) {
            // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
            if (distributedNodes[nodeIndex].nodeType !== Node.ELEMENT_NODE) continue;

            if (this._composedTreeContains(distributedNodes[nodeIndex], child)) {
              return true;
            }
          }
        }

        return false;
      },

      _scrollInteractionHandler: function(event) {
        // Avoid canceling an event with cancelable=false, e.g. scrolling is in
        // progress and cannot be interrupted.
        if (event.cancelable && this._shouldPreventScrolling(event)) {
          event.preventDefault();
        }
        // If event has targetTouches (touch event), update last touch position.
        if (event.targetTouches) {
          var touch = event.targetTouches[0];
          lastTouchPosition.pageX = touch.pageX;
          lastTouchPosition.pageY = touch.pageY;
        }
      },

      _lockScrollInteractions: function() {
        this._boundScrollHandler = this._boundScrollHandler ||
          this._scrollInteractionHandler.bind(this);
        for (var i = 0, l = scrollEvents.length; i < l; i++) {
          // NOTE: browsers that don't support objects as third arg will
          // interpret it as boolean, hence useCapture = true in this case. 
          document.addEventListener(scrollEvents[i], this._boundScrollHandler, {
            capture: true,
            passive: false
          });
        }
      },

      _unlockScrollInteractions: function() {
        for (var i = 0, l = scrollEvents.length; i < l; i++) {
          // NOTE: browsers that don't support objects as third arg will
          // interpret it as boolean, hence useCapture = true in this case.
          document.removeEventListener(scrollEvents[i], this._boundScrollHandler, {
            capture: true,
            passive: false
          });
        }
      },

      /**
       * Returns true if the event causes scroll outside the current locking
       * element, e.g. pointer/keyboard interactions, or scroll "leaking"
       * outside the locking element when it is already at its scroll boundaries.
       * @param {!Event} event
       * @return {boolean}
       * @private
       */
      _shouldPreventScrolling: function(event) {

        // Update if root target changed. For touch events, ensure we don't
        // update during touchmove.
        var target = Polymer.dom(event).rootTarget;
        if (event.type !== 'touchmove' && lastRootTarget !== target) {
          lastRootTarget = target;
          lastScrollableNodes = this._getScrollableNodes(Polymer.dom(event).path);
        }

        // Prevent event if no scrollable nodes.
        if (!lastScrollableNodes.length) {
          return true;
        }
        // Don't prevent touchstart event inside the locking element when it has
        // scrollable nodes.
        if (event.type === 'touchstart') {
          return false;
        }
        // Get deltaX/Y.
        var info = this._getScrollInfo(event);
        // Prevent if there is no child that can scroll.
        return !this._getScrollingNode(lastScrollableNodes, info.deltaX, info.deltaY);
      },

      /**
       * Returns an array of scrollable nodes up to the current locking element,
       * which is included too if scrollable.
       * @param {!Array<Node>} nodes
       * @return {Array<Node>} scrollables
       * @private
       */
      _getScrollableNodes: function(nodes) {
        var scrollables = [];
        var lockingIndex = nodes.indexOf(this.currentLockingElement);
        // Loop from root target to locking element (included).
        for (var i = 0; i <= lockingIndex; i++) {
          // Skip non-Element nodes.
          if (nodes[i].nodeType !== Node.ELEMENT_NODE) {
            continue;
          }
          var node = /** @type {!Element} */ (nodes[i]);
          // Check inline style before checking computed style.
          var style = node.style;
          if (style.overflow !== 'scroll' && style.overflow !== 'auto') {
            style = window.getComputedStyle(node);
          }
          if (style.overflow === 'scroll' || style.overflow === 'auto') {
            scrollables.push(node);
          }
        }
        return scrollables;
      },

      /**
       * Returns the node that is scrolling. If there is no scrolling,
       * returns undefined.
       * @param {!Array<Node>} nodes
       * @param {number} deltaX Scroll delta on the x-axis
       * @param {number} deltaY Scroll delta on the y-axis
       * @return {Node|undefined}
       * @private
       */
      _getScrollingNode: function(nodes, deltaX, deltaY) {
        // No scroll.
        if (!deltaX && !deltaY) {
          return;
        }
        // Check only one axis according to where there is more scroll.
        // Prefer vertical to horizontal.
        var verticalScroll = Math.abs(deltaY) >= Math.abs(deltaX);
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          var canScroll = false;
          if (verticalScroll) {
            // delta < 0 is scroll up, delta > 0 is scroll down.
            canScroll = deltaY < 0 ? node.scrollTop > 0 :
              node.scrollTop < node.scrollHeight - node.clientHeight;
          } else {
            // delta < 0 is scroll left, delta > 0 is scroll right.
            canScroll = deltaX < 0 ? node.scrollLeft > 0 :
              node.scrollLeft < node.scrollWidth - node.clientWidth;
          }
          if (canScroll) {
            return node;
          }
        }
      },

      /**
       * Returns scroll `deltaX` and `deltaY`.
       * @param {!Event} event The scroll event
       * @return {{deltaX: number, deltaY: number}} Object containing the
       * x-axis scroll delta (positive: scroll right, negative: scroll left,
       * 0: no scroll), and the y-axis scroll delta (positive: scroll down,
       * negative: scroll up, 0: no scroll).
       * @private
       */
      _getScrollInfo: function(event) {
        var info = {
          deltaX: event.deltaX,
          deltaY: event.deltaY
        };
        // Already available.
        if ('deltaX' in event) {
          // do nothing, values are already good.
        }
        // Safari has scroll info in `wheelDeltaX/Y`.
        else if ('wheelDeltaX' in event) {
          info.deltaX = -event.wheelDeltaX;
          info.deltaY = -event.wheelDeltaY;
        }
        // Firefox has scroll info in `detail` and `axis`.
        else if ('axis' in event) {
          info.deltaX = event.axis === 1 ? event.detail : 0;
          info.deltaY = event.axis === 2 ? event.detail : 0;
        }
        // On mobile devices, calculate scroll direction.
        else if (event.targetTouches) {
          var touch = event.targetTouches[0];
          // Touch moves from right to left => scrolling goes right.
          info.deltaX = lastTouchPosition.pageX - touch.pageX;
          // Touch moves from down to up => scrolling goes down.
          info.deltaY = lastTouchPosition.pageY - touch.pageY;
        }
        return info;
      }
    };
  })();
(function() {
      'use strict';

      Polymer({
        is: 'iron-dropdown',

        behaviors: [
          Polymer.IronControlState,
          Polymer.IronA11yKeysBehavior,
          Polymer.IronOverlayBehavior,
          Polymer.NeonAnimationRunnerBehavior
        ],

        properties: {
          /**
           * The orientation against which to align the dropdown content
           * horizontally relative to the dropdown trigger.
           * Overridden from `Polymer.IronFitBehavior`.
           */
          horizontalAlign: {
            type: String,
            value: 'left',
            reflectToAttribute: true
          },

          /**
           * The orientation against which to align the dropdown content
           * vertically relative to the dropdown trigger.
           * Overridden from `Polymer.IronFitBehavior`.
           */
          verticalAlign: {
            type: String,
            value: 'top',
            reflectToAttribute: true
          },

          /**
           * An animation config. If provided, this will be used to animate the
           * opening of the dropdown. Pass an Array for multiple animations.
           * See `neon-animation` documentation for more animation configuration
           * details.
           */
          openAnimationConfig: {
            type: Object
          },

          /**
           * An animation config. If provided, this will be used to animate the
           * closing of the dropdown. Pass an Array for multiple animations.
           * See `neon-animation` documentation for more animation configuration
           * details.
           */
          closeAnimationConfig: {
            type: Object
          },

          /**
           * If provided, this will be the element that will be focused when
           * the dropdown opens.
           */
          focusTarget: {
            type: Object
          },

          /**
           * Set to true to disable animations when opening and closing the
           * dropdown.
           */
          noAnimations: {
            type: Boolean,
            value: false
          },

          /**
           * By default, the dropdown will constrain scrolling on the page
           * to itself when opened.
           * Set to true in order to prevent scroll from being constrained
           * to the dropdown when it opens.
           */
          allowOutsideScroll: {
            type: Boolean,
            value: false
          },

          /**
           * Callback for scroll events.
           * @type {Function}
           * @private
           */
          _boundOnCaptureScroll: {
            type: Function,
            value: function() {
              return this._onCaptureScroll.bind(this);
            }
          }
        },

        listeners: {
          'neon-animation-finish': '_onNeonAnimationFinish'
        },

        observers: [
          '_updateOverlayPosition(positionTarget, verticalAlign, horizontalAlign, verticalOffset, horizontalOffset)'
        ],

        /**
         * The element that is contained by the dropdown, if any.
         */
        get containedElement() {
          // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
          var nodes = Polymer.dom(this.$.content).getDistributedNodes();
          for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].nodeType === Node.ELEMENT_NODE) {
              return nodes[i];
            }
          }
        },

        ready: function() {
          // Memoized scrolling position, used to block scrolling outside.
          this._scrollTop = 0;
          this._scrollLeft = 0;
          // Used to perform a non-blocking refit on scroll.
          this._refitOnScrollRAF = null;
        },

        attached: function () {
          if (!this.sizingTarget || this.sizingTarget === this) {
            this.sizingTarget = this.containedElement || this;
          }
        },

        detached: function() {
          this.cancelAnimation();
          document.removeEventListener('scroll', this._boundOnCaptureScroll);
          Polymer.IronDropdownScrollManager.removeScrollLock(this);
        },

        /**
         * Called when the value of `opened` changes.
         * Overridden from `IronOverlayBehavior`
         */
        _openedChanged: function() {
          if (this.opened && this.disabled) {
            this.cancel();
          } else {
            this.cancelAnimation();
            this._updateAnimationConfig();
            this._saveScrollPosition();
            if (this.opened) {
              document.addEventListener('scroll', this._boundOnCaptureScroll);
              !this.allowOutsideScroll && Polymer.IronDropdownScrollManager.pushScrollLock(this);
            } else {
              document.removeEventListener('scroll', this._boundOnCaptureScroll);
              Polymer.IronDropdownScrollManager.removeScrollLock(this);
            }
            Polymer.IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
          }
        },

        /**
         * Overridden from `IronOverlayBehavior`.
         */
        _renderOpened: function() {
          if (!this.noAnimations && this.animationConfig.open) {
            this.$.contentWrapper.classList.add('animating');
            this.playAnimation('open');
          } else {
            Polymer.IronOverlayBehaviorImpl._renderOpened.apply(this, arguments);
          }
        },

        /**
         * Overridden from `IronOverlayBehavior`.
         */
        _renderClosed: function() {
          if (!this.noAnimations && this.animationConfig.close) {
            this.$.contentWrapper.classList.add('animating');
            this.playAnimation('close');
          } else {
            Polymer.IronOverlayBehaviorImpl._renderClosed.apply(this, arguments);
          }
        },

        /**
         * Called when animation finishes on the dropdown (when opening or
         * closing). Responsible for "completing" the process of opening or
         * closing the dropdown by positioning it or setting its display to
         * none.
         */
        _onNeonAnimationFinish: function() {
          this.$.contentWrapper.classList.remove('animating');
          if (this.opened) {
            this._finishRenderOpened();
          } else {
            this._finishRenderClosed();
          }
        },

        _onCaptureScroll: function() {
          if (!this.allowOutsideScroll) {
            this._restoreScrollPosition();
          } else {
            this._refitOnScrollRAF && window.cancelAnimationFrame(this._refitOnScrollRAF);
            this._refitOnScrollRAF = window.requestAnimationFrame(this.refit.bind(this));
          }
        },

        /**
         * Memoizes the scroll position of the outside scrolling element.
         * @private
         */
        _saveScrollPosition: function() {
          if (document.scrollingElement) {
            this._scrollTop = document.scrollingElement.scrollTop;
            this._scrollLeft = document.scrollingElement.scrollLeft;
          } else {
            // Since we don't know if is the body or html, get max.
            this._scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
            this._scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
          }
        },

        /**
         * Resets the scroll position of the outside scrolling element.
         * @private
         */
        _restoreScrollPosition: function() {
          if (document.scrollingElement) {
            document.scrollingElement.scrollTop = this._scrollTop;
            document.scrollingElement.scrollLeft = this._scrollLeft;
          } else {
            // Since we don't know if is the body or html, set both.
            document.documentElement.scrollTop = this._scrollTop;
            document.documentElement.scrollLeft = this._scrollLeft;
            document.body.scrollTop = this._scrollTop;
            document.body.scrollLeft = this._scrollLeft;
          }
        },

        /**
         * Constructs the final animation config from different properties used
         * to configure specific parts of the opening and closing animations.
         */
        _updateAnimationConfig: function() {
          // Update the animation node to be the containedElement.
          var animationNode = this.containedElement;
          var animations = [].concat(this.openAnimationConfig || []).concat(this.closeAnimationConfig || []);
          for (var i = 0; i < animations.length; i++) {
            animations[i].node = animationNode;
          }
          this.animationConfig = {
            open: this.openAnimationConfig,
            close: this.closeAnimationConfig
          };
        },

        /**
         * Updates the overlay position based on configured horizontal
         * and vertical alignment.
         */
        _updateOverlayPosition: function() {
          if (this.isAttached) {
            // This triggers iron-resize, and iron-overlay-behavior will call refit if needed.
            this.notifyResize();
          }
        },

        /**
         * Apply focus to focusTarget or containedElement
         */
        _applyFocus: function() {
          var focusTarget = this.focusTarget || this.containedElement;
          if (focusTarget && this.opened && !this.noAutoFocus) {
            focusTarget.focus();
          } else {
            Polymer.IronOverlayBehaviorImpl._applyFocus.apply(this, arguments);
          }
        }
      });
    })();
/**
   * Use `Polymer.NeonAnimationBehavior` to implement an animation.
   * @polymerBehavior
   */
  Polymer.NeonAnimationBehavior = {

    properties: {

      /**
       * Defines the animation timing.
       */
      animationTiming: {
        type: Object,
        value: function() {
          return {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'both'
          }
        }
      }

    },

    /**
     * Can be used to determine that elements implement this behavior.
     */
    isNeonAnimation: true,

    /**
     * Do any animation configuration here.
     */
    // configure: function(config) {
    // },

    created: function() {
      if (!document.body.animate) {
        console.warn('No web animations detected. This element will not' +
            ' function without a web animations polyfill.');
      }
    },

    /**
     * Returns the animation timing by mixing in properties from `config` to the defaults defined
     * by the animation.
     */
    timingFromConfig: function(config) {
      if (config.timing) {
        for (var property in config.timing) {
          this.animationTiming[property] = config.timing[property];
        }
      }
      return this.animationTiming;
    },

    /**
     * Sets `transform` and `transformOrigin` properties along with the prefixed versions.
     */
    setPrefixedProperty: function(node, property, value) {
      var map = {
        'transform': ['webkitTransform'],
        'transformOrigin': ['mozTransformOrigin', 'webkitTransformOrigin']
      };
      var prefixes = map[property];
      for (var prefix, index = 0; prefix = prefixes[index]; index++) {
        node.style[prefix] = value;
      }
      node.style[property] = value;
    },

    /**
     * Called when the animation finishes.
     */
    complete: function() {}

  };
Polymer({

    is: 'fade-in-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      this._effect = new KeyframeEffect(node, [
        {'opacity': '0'},
        {'opacity': '1'}
      ], this.timingFromConfig(config));
      return this._effect;
    }

  });
Polymer({

    is: 'fade-out-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      this._effect = new KeyframeEffect(node, [
        {'opacity': '1'},
        {'opacity': '0'}
      ], this.timingFromConfig(config));
      return this._effect;
    }

  });
Polymer({
    is: 'paper-menu-grow-height-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      var rect = node.getBoundingClientRect();
      var height = rect.height;

      this._effect = new KeyframeEffect(node, [{
        height: (height / 2) + 'px'
      }, {
        height: height + 'px'
      }], this.timingFromConfig(config));

      return this._effect;
    }
  });

  Polymer({
    is: 'paper-menu-grow-width-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      var rect = node.getBoundingClientRect();
      var width = rect.width;

      this._effect = new KeyframeEffect(node, [{
        width: (width / 2) + 'px'
      }, {
        width: width + 'px'
      }], this.timingFromConfig(config));

      return this._effect;
    }
  });

  Polymer({
    is: 'paper-menu-shrink-width-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      var rect = node.getBoundingClientRect();
      var width = rect.width;

      this._effect = new KeyframeEffect(node, [{
        width: width + 'px'
      }, {
        width: width - (width / 20) + 'px'
      }], this.timingFromConfig(config));

      return this._effect;
    }
  });

  Polymer({
    is: 'paper-menu-shrink-height-animation',

    behaviors: [
      Polymer.NeonAnimationBehavior
    ],

    configure: function(config) {
      var node = config.node;
      var rect = node.getBoundingClientRect();
      var height = rect.height;
      var top = rect.top;

      this.setPrefixedProperty(node, 'transformOrigin', '0 0');

      this._effect = new KeyframeEffect(node, [{
        height: height + 'px',
        transform: 'translateY(0)'
      }, {
        height: height / 2 + 'px',
        transform: 'translateY(-20px)'
      }], this.timingFromConfig(config));

      return this._effect;
    }
  });
(function() {
      'use strict';

      var config = {
        ANIMATION_CUBIC_BEZIER: 'cubic-bezier(.3,.95,.5,1)',
        MAX_ANIMATION_TIME_MS: 400
      };

      var PaperMenuButton = Polymer({
        is: 'paper-menu-button',

        /**
         * Fired when the dropdown opens.
         *
         * @event paper-dropdown-open
         */

        /**
         * Fired when the dropdown closes.
         *
         * @event paper-dropdown-close
         */

        behaviors: [
          Polymer.IronA11yKeysBehavior,
          Polymer.IronControlState
        ],

        properties: {
          /**
           * True if the content is currently displayed.
           */
          opened: {
            type: Boolean,
            value: false,
            notify: true,
            observer: '_openedChanged'
          },

          /**
           * The orientation against which to align the menu dropdown
           * horizontally relative to the dropdown trigger.
           */
          horizontalAlign: {
            type: String,
            value: 'left',
            reflectToAttribute: true
          },

          /**
           * The orientation against which to align the menu dropdown
           * vertically relative to the dropdown trigger.
           */
          verticalAlign: {
            type: String,
            value: 'top',
            reflectToAttribute: true
          },

          /**
           * If true, the `horizontalAlign` and `verticalAlign` properties will
           * be considered preferences instead of strict requirements when
           * positioning the dropdown and may be changed if doing so reduces
           * the area of the dropdown falling outside of `fitInto`.
           */
          dynamicAlign: {
            type: Boolean
          },

          /**
           * A pixel value that will be added to the position calculated for the
           * given `horizontalAlign`. Use a negative value to offset to the
           * left, or a positive value to offset to the right.
           */
          horizontalOffset: {
            type: Number,
            value: 0,
            notify: true
          },

          /**
           * A pixel value that will be added to the position calculated for the
           * given `verticalAlign`. Use a negative value to offset towards the
           * top, or a positive value to offset towards the bottom.
           */
          verticalOffset: {
            type: Number,
            value: 0,
            notify: true
          },

          /**
           * If true, the dropdown will be positioned so that it doesn't overlap
           * the button.
           */
          noOverlap: {
            type: Boolean
          },

          /**
           * Set to true to disable animations when opening and closing the
           * dropdown.
           */
          noAnimations: {
            type: Boolean,
            value: false
          },

          /**
           * Set to true to disable automatically closing the dropdown after
           * a selection has been made.
           */
          ignoreSelect: {
            type: Boolean,
            value: false
          },

          /**
           * Set to true to enable automatically closing the dropdown after an
           * item has been activated, even if the selection did not change.
           */
          closeOnActivate: {
            type: Boolean,
            value: false
          },

          /**
           * An animation config. If provided, this will be used to animate the
           * opening of the dropdown.
           */
          openAnimationConfig: {
            type: Object,
            value: function() {
              return [{
                name: 'fade-in-animation',
                timing: {
                  delay: 100,
                  duration: 200
                }
              }, {
                name: 'paper-menu-grow-width-animation',
                timing: {
                  delay: 100,
                  duration: 150,
                  easing: config.ANIMATION_CUBIC_BEZIER
                }
              }, {
                name: 'paper-menu-grow-height-animation',
                timing: {
                  delay: 100,
                  duration: 275,
                  easing: config.ANIMATION_CUBIC_BEZIER
                }
              }];
            }
          },

          /**
           * An animation config. If provided, this will be used to animate the
           * closing of the dropdown.
           */
          closeAnimationConfig: {
            type: Object,
            value: function() {
              return [{
                name: 'fade-out-animation',
                timing: {
                  duration: 150
                }
              }, {
                name: 'paper-menu-shrink-width-animation',
                timing: {
                  delay: 100,
                  duration: 50,
                  easing: config.ANIMATION_CUBIC_BEZIER
                }
              }, {
                name: 'paper-menu-shrink-height-animation',
                timing: {
                  duration: 200,
                  easing: 'ease-in'
                }
              }];
            }
          },

          /**
           * By default, the dropdown will constrain scrolling on the page
           * to itself when opened.
           * Set to true in order to prevent scroll from being constrained
           * to the dropdown when it opens.
           */
          allowOutsideScroll: {
            type: Boolean,
            value: false
          },

          /**
           * Whether focus should be restored to the button when the menu closes.
           */
          restoreFocusOnClose: {
            type: Boolean,
            value: true
          },

          /**
           * This is the element intended to be bound as the focus target
           * for the `iron-dropdown` contained by `paper-menu-button`.
           */
          _dropdownContent: {
            type: Object
          }
        },

        hostAttributes: {
          role: 'group',
          'aria-haspopup': 'true'
        },

        listeners: {
          'iron-activate': '_onIronActivate',
          'iron-select': '_onIronSelect'
        },

        /**
         * The content element that is contained by the menu button, if any.
         */
        get contentElement() {
          // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
          var nodes = Polymer.dom(this.$.content).getDistributedNodes();
          for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].nodeType === Node.ELEMENT_NODE) {
              return nodes[i];
            }
          }
        },

        /**
         * Toggles the drowpdown content between opened and closed.
         */
        toggle: function() {
          if (this.opened) {
            this.close();
          } else {
            this.open();
          }
        },

        /**
         * Make the dropdown content appear as an overlay positioned relative
         * to the dropdown trigger.
         */
        open: function() {
          if (this.disabled) {
            return;
          }

          this.$.dropdown.open();
        },

        /**
         * Hide the dropdown content.
         */
        close: function() {
          this.$.dropdown.close();
        },

        /**
         * When an `iron-select` event is received, the dropdown should
         * automatically close on the assumption that a value has been chosen.
         *
         * @param {CustomEvent} event A CustomEvent instance with type
         * set to `"iron-select"`.
         */
        _onIronSelect: function(event) {
          if (!this.ignoreSelect) {
            this.close();
          }
        },

        /**
         * Closes the dropdown when an `iron-activate` event is received if
         * `closeOnActivate` is true.
         *
         * @param {CustomEvent} event A CustomEvent of type 'iron-activate'.
         */
        _onIronActivate: function(event) {
          if (this.closeOnActivate) {
            this.close();
          }
        },

        /**
         * When the dropdown opens, the `paper-menu-button` fires `paper-open`.
         * When the dropdown closes, the `paper-menu-button` fires `paper-close`.
         *
         * @param {boolean} opened True if the dropdown is opened, otherwise false.
         * @param {boolean} oldOpened The previous value of `opened`.
         */
        _openedChanged: function(opened, oldOpened) {
          if (opened) {
            // TODO(cdata): Update this when we can measure changes in distributed
            // children in an idiomatic way.
            // We poke this property in case the element has changed. This will
            // cause the focus target for the `iron-dropdown` to be updated as
            // necessary:
            this._dropdownContent = this.contentElement;
            this.fire('paper-dropdown-open');
          } else if (oldOpened != null) {
            this.fire('paper-dropdown-close');
          }
        },

        /**
         * If the dropdown is open when disabled becomes true, close the
         * dropdown.
         *
         * @param {boolean} disabled True if disabled, otherwise false.
         */
        _disabledChanged: function(disabled) {
          Polymer.IronControlState._disabledChanged.apply(this, arguments);
          if (disabled && this.opened) {
            this.close();
          }
        },

        __onIronOverlayCanceled: function(event) {
          var uiEvent = event.detail;
          var target = Polymer.dom(uiEvent).rootTarget;
          var trigger = this.$.trigger;
          var path = Polymer.dom(uiEvent).path;

          if (path.indexOf(trigger) > -1) {
            event.preventDefault();
          }
        }
      });

      Object.keys(config).forEach(function (key) {
        PaperMenuButton[key] = config[key];
      });

      Polymer.PaperMenuButton = PaperMenuButton;
    })();
(function() {
      'use strict';

      Polymer({
        is: 'paper-dropdown-menu',

        behaviors: [
          Polymer.IronButtonState,
          Polymer.IronControlState,
          Polymer.IronFormElementBehavior,
          Polymer.IronValidatableBehavior
        ],

        properties: {
          /**
           * The derived "label" of the currently selected item. This value
           * is the `label` property on the selected item if set, or else the
           * trimmed text content of the selected item.
           */
          selectedItemLabel: {
            type: String,
            notify: true,
            readOnly: true
          },

          /**
           * The last selected item. An item is selected if the dropdown menu has
           * a child with slot `dropdown-content`, and that child triggers an
           * `iron-select` event with the selected `item` in the `detail`.
           *
           * @type {?Object}
           */
          selectedItem: {
            type: Object,
            notify: true,
            readOnly: true
          },

          /**
           * The value for this element that will be used when submitting in
           * a form. It is read only, and will always have the same value
           * as `selectedItemLabel`.
           */
          value: {
            type: String,
            notify: true,
            readOnly: true
          },

          /**
           * The label for the dropdown.
           */
          label: {
            type: String
          },

          /**
           * The placeholder for the dropdown.
           */
          placeholder: {
            type: String
          },

          /**
           * The error message to display when invalid.
           */
          errorMessage: {
              type: String
          },

          /**
           * True if the dropdown is open. Otherwise, false.
           */
          opened: {
            type: Boolean,
            notify: true,
            value: false,
            observer: '_openedChanged'
          },

          /**
           * By default, the dropdown will constrain scrolling on the page
           * to itself when opened.
           * Set to true in order to prevent scroll from being constrained
           * to the dropdown when it opens.
           */
          allowOutsideScroll: {
            type: Boolean,
            value: false
          },

          /**
           * Set to true to disable the floating label. Bind this to the
           * `<paper-input-container>`'s `noLabelFloat` property.
           */
          noLabelFloat: {
              type: Boolean,
              value: false,
              reflectToAttribute: true
          },

          /**
           * Set to true to always float the label. Bind this to the
           * `<paper-input-container>`'s `alwaysFloatLabel` property.
           */
          alwaysFloatLabel: {
            type: Boolean,
            value: false
          },

          /**
           * Set to true to disable animations when opening and closing the
           * dropdown.
           */
          noAnimations: {
            type: Boolean,
            value: false
          },

          /**
           * The orientation against which to align the menu dropdown
           * horizontally relative to the dropdown trigger.
           */
          horizontalAlign: {
            type: String,
            value: 'right'
          },

          /**
           * The orientation against which to align the menu dropdown
           * vertically relative to the dropdown trigger.
           */
          verticalAlign: {
            type: String,
            value: 'top'
          },

          /**
           * If true, the `horizontalAlign` and `verticalAlign` properties will
           * be considered preferences instead of strict requirements when
           * positioning the dropdown and may be changed if doing so reduces
           * the area of the dropdown falling outside of `fitInto`.
           */
          dynamicAlign: {
            type: Boolean
          },
            
          /**
           * Whether focus should be restored to the dropdown when the menu closes.
           */
          restoreFocusOnClose: {
            type: Boolean,
            value: true
          },
        },

        listeners: {
          'tap': '_onTap'
        },

        keyBindings: {
          'up down': 'open',
          'esc': 'close'
        },

        hostAttributes: {
          role: 'combobox',
          'aria-autocomplete': 'none',
          'aria-haspopup': 'true'
        },

        observers: [
          '_selectedItemChanged(selectedItem)'
        ],

        attached: function() {
          // NOTE(cdata): Due to timing, a preselected value in a `IronSelectable`
          // child will cause an `iron-select` event to fire while the element is
          // still in a `DocumentFragment`. This has the effect of causing
          // handlers not to fire. So, we double check this value on attached:
          var contentElement = this.contentElement;
          if (contentElement && contentElement.selectedItem) {
            this._setSelectedItem(contentElement.selectedItem);
          }
        },

        /**
         * The content element that is contained by the dropdown menu, if any.
         */
        get contentElement() {
          // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
          var nodes = Polymer.dom(this.$.content).getDistributedNodes();
          for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].nodeType === Node.ELEMENT_NODE) {
              return nodes[i];
            }
          }
        },

        /**
         * Show the dropdown content.
         */
        open: function() {
          this.$.menuButton.open();
        },

        /**
         * Hide the dropdown content.
         */
        close: function() {
          this.$.menuButton.close();
        },

        /**
         * A handler that is called when `iron-select` is fired.
         *
         * @param {CustomEvent} event An `iron-select` event.
         */
        _onIronSelect: function(event) {
          this._setSelectedItem(event.detail.item);
        },

        /**
         * A handler that is called when `iron-deselect` is fired.
         *
         * @param {CustomEvent} event An `iron-deselect` event.
         */
        _onIronDeselect: function(event) {
          this._setSelectedItem(null);
        },

        /**
         * A handler that is called when the dropdown is tapped.
         *
         * @param {CustomEvent} event A tap event.
         */
        _onTap: function(event) {
          if (Polymer.Gestures.findOriginalTarget(event) === this) {
            this.open();
          }
        },

        /**
         * Compute the label for the dropdown given a selected item.
         *
         * @param {Element} selectedItem A selected Element item, with an
         * optional `label` property.
         */
        _selectedItemChanged: function(selectedItem) {
          var value = '';
          if (!selectedItem) {
            value = '';
          } else {
            value = selectedItem.label || selectedItem.getAttribute('label') || selectedItem.textContent.trim();
          }

          this._setValue(value);
          this._setSelectedItemLabel(value);
        },

        /**
         * Compute the vertical offset of the menu based on the value of
         * `noLabelFloat`.
         *
         * @param {boolean} noLabelFloat True if the label should not float
         * above the input, otherwise false.
         */
        _computeMenuVerticalOffset: function(noLabelFloat) {
          // NOTE(cdata): These numbers are somewhat magical because they are
          // derived from the metrics of elements internal to `paper-input`'s
          // template. The metrics will change depending on whether or not the
          // input has a floating label.
          return noLabelFloat ? -4 : 8;
        },

        /**
         * Returns false if the element is required and does not have a selection,
         * and true otherwise.
         * @param {*=} _value Ignored.
         * @return {boolean} true if `required` is false, or if `required` is true
         * and the element has a valid selection.
         */
        _getValidity: function(_value) {
          return this.disabled || !this.required || (this.required && !!this.value);
        },

        _openedChanged: function() {
          var openState = this.opened ? 'true' : 'false';
          var e = this.contentElement;
          if (e) {
            e.setAttribute('aria-expanded', openState);
          }
        }
      });
    })();
/** @polymerBehavior Polymer.PaperItemBehavior */
  Polymer.PaperItemBehaviorImpl = {
    hostAttributes: {
      role: 'option',
      tabindex: '0'
    }
  };

  /** @polymerBehavior */
  Polymer.PaperItemBehavior = [
    Polymer.IronButtonState,
    Polymer.IronControlState,
    Polymer.PaperItemBehaviorImpl
  ];
Polymer({
      is: 'paper-item',

      behaviors: [
        Polymer.PaperItemBehavior
      ]
    });
Polymer({
      is: 'paper-item-body'
    });
Polymer({
      is: 'paper-icon-item',

      behaviors: [
        Polymer.PaperItemBehavior
      ]
    });
/**
   * @param {!Function} selectCallback
   * @constructor
   */
  Polymer.IronSelection = function(selectCallback) {
    this.selection = [];
    this.selectCallback = selectCallback;
  };

  Polymer.IronSelection.prototype = {

    /**
     * Retrieves the selected item(s).
     *
     * @method get
     * @returns Returns the selected item(s). If the multi property is true,
     * `get` will return an array, otherwise it will return
     * the selected item or undefined if there is no selection.
     */
    get: function() {
      return this.multi ? this.selection.slice() : this.selection[0];
    },

    /**
     * Clears all the selection except the ones indicated.
     *
     * @method clear
     * @param {Array} excludes items to be excluded.
     */
    clear: function(excludes) {
      this.selection.slice().forEach(function(item) {
        if (!excludes || excludes.indexOf(item) < 0) {
          this.setItemSelected(item, false);
        }
      }, this);
    },

    /**
     * Indicates if a given item is selected.
     *
     * @method isSelected
     * @param {*} item The item whose selection state should be checked.
     * @returns Returns true if `item` is selected.
     */
    isSelected: function(item) {
      return this.selection.indexOf(item) >= 0;
    },

    /**
     * Sets the selection state for a given item to either selected or deselected.
     *
     * @method setItemSelected
     * @param {*} item The item to select.
     * @param {boolean} isSelected True for selected, false for deselected.
     */
    setItemSelected: function(item, isSelected) {
      if (item != null) {
        if (isSelected !== this.isSelected(item)) {
          // proceed to update selection only if requested state differs from current
          if (isSelected) {
            this.selection.push(item);
          } else {
            var i = this.selection.indexOf(item);
            if (i >= 0) {
              this.selection.splice(i, 1);
            }
          }
          if (this.selectCallback) {
            this.selectCallback(item, isSelected);
          }
        }
      }
    },

    /**
     * Sets the selection state for a given item. If the `multi` property
     * is true, then the selected state of `item` will be toggled; otherwise
     * the `item` will be selected.
     *
     * @method select
     * @param {*} item The item to select.
     */
    select: function(item) {
      if (this.multi) {
        this.toggle(item);
      } else if (this.get() !== item) {
        this.setItemSelected(this.get(), false);
        this.setItemSelected(item, true);
      }
    },

    /**
     * Toggles the selection state for `item`.
     *
     * @method toggle
     * @param {*} item The item to toggle.
     */
    toggle: function(item) {
      this.setItemSelected(item, !this.isSelected(item));
    }

  };
/**
   * @polymerBehavior Polymer.IronSelectableBehavior
   */
  Polymer.IronSelectableBehavior = {

      /**
       * Fired when iron-selector is activated (selected or deselected).
       * It is fired before the selected items are changed.
       * Cancel the event to abort selection.
       *
       * @event iron-activate
       */

      /**
       * Fired when an item is selected
       *
       * @event iron-select
       */

      /**
       * Fired when an item is deselected
       *
       * @event iron-deselect
       */

      /**
       * Fired when the list of selectable items changes (e.g., items are
       * added or removed). The detail of the event is a mutation record that
       * describes what changed.
       *
       * @event iron-items-changed
       */

    properties: {

      /**
       * If you want to use an attribute value or property of an element for
       * `selected` instead of the index, set this to the name of the attribute
       * or property. Hyphenated values are converted to camel case when used to
       * look up the property of a selectable element. Camel cased values are
       * *not* converted to hyphenated values for attribute lookup. It's
       * recommended that you provide the hyphenated form of the name so that
       * selection works in both cases. (Use `attr-or-property-name` instead of
       * `attrOrPropertyName`.)
       */
      attrForSelected: {
        type: String,
        value: null
      },

      /**
       * Gets or sets the selected element. The default is to use the index of the item.
       * @type {string|number}
       */
      selected: {
        type: String,
        notify: true
      },

      /**
       * Returns the currently selected item.
       *
       * @type {?Object}
       */
      selectedItem: {
        type: Object,
        readOnly: true,
        notify: true
      },

      /**
       * The event that fires from items when they are selected. Selectable
       * will listen for this event from items and update the selection state.
       * Set to empty string to listen to no events.
       */
      activateEvent: {
        type: String,
        value: 'tap',
        observer: '_activateEventChanged'
      },

      /**
       * This is a CSS selector string.  If this is set, only items that match the CSS selector
       * are selectable.
       */
      selectable: String,

      /**
       * The class to set on elements when selected.
       */
      selectedClass: {
        type: String,
        value: 'iron-selected'
      },

      /**
       * The attribute to set on elements when selected.
       */
      selectedAttribute: {
        type: String,
        value: null
      },

      /**
       * Default fallback if the selection based on selected with `attrForSelected`
       * is not found.
       */
      fallbackSelection: {
        type: String,
        value: null
      },

      /**
       * The list of items from which a selection can be made.
       */
      items: {
        type: Array,
        readOnly: true,
        notify: true,
        value: function() {
          return [];
        }
      },

      /**
       * The set of excluded elements where the key is the `localName`
       * of the element that will be ignored from the item list.
       *
       * @default {template: 1}
       */
      _excludedLocalNames: {
        type: Object,
        value: function() {
          return {
            'template': 1,
            'dom-bind': 1,
            'dom-if': 1,
            'dom-repeat': 1,
          };
        }
      }
    },

    observers: [
      '_updateAttrForSelected(attrForSelected)',
      '_updateSelected(selected)',
      '_checkFallback(fallbackSelection)'
    ],

    created: function() {
      this._bindFilterItem = this._filterItem.bind(this);
      this._selection = new Polymer.IronSelection(this._applySelection.bind(this));
    },

    attached: function() {
      this._observer = this._observeItems(this);
      this._addListener(this.activateEvent);
    },

    detached: function() {
      if (this._observer) {
        Polymer.dom(this).unobserveNodes(this._observer);
      }
      this._removeListener(this.activateEvent);
    },

    /**
     * Returns the index of the given item.
     *
     * @method indexOf
     * @param {Object} item
     * @returns Returns the index of the item
     */
    indexOf: function(item) {
      return this.items.indexOf(item);
    },

    /**
     * Selects the given value.
     *
     * @method select
     * @param {string|number} value the value to select.
     */
    select: function(value) {
      this.selected = value;
    },

    /**
     * Selects the previous item.
     *
     * @method selectPrevious
     */
    selectPrevious: function() {
      var length = this.items.length;
      var index = (Number(this._valueToIndex(this.selected)) - 1 + length) % length;
      this.selected = this._indexToValue(index);
    },

    /**
     * Selects the next item.
     *
     * @method selectNext
     */
    selectNext: function() {
      var index = (Number(this._valueToIndex(this.selected)) + 1) % this.items.length;
      this.selected = this._indexToValue(index);
    },

    /**
     * Selects the item at the given index.
     *
     * @method selectIndex
     */
    selectIndex: function(index) {
      this.select(this._indexToValue(index));
    },

    /**
     * Force a synchronous update of the `items` property.
     *
     * NOTE: Consider listening for the `iron-items-changed` event to respond to
     * updates to the set of selectable items after updates to the DOM list and
     * selection state have been made.
     *
     * WARNING: If you are using this method, you should probably consider an
     * alternate approach. Synchronously querying for items is potentially
     * slow for many use cases. The `items` property will update asynchronously
     * on its own to reflect selectable items in the DOM.
     */
    forceSynchronousItemUpdate: function() {
      if (this._observer && typeof this._observer.flush === "function") {
        // NOTE(bicknellr): `Polymer.dom.flush` above is no longer sufficient to
        // trigger `observeNodes` callbacks. Polymer 2.x returns an object from
        // `observeNodes` with a `flush` that synchronously gives the callback
        // any pending MutationRecords (retrieved with `takeRecords`). Any case
        // where ShadyDOM flushes were expected to synchronously trigger item
        // updates will now require calling `forceSynchronousItemUpdate`.
        this._observer.flush();
      } else {
        this._updateItems();
      }
    },

    // UNUSED, FOR API COMPATIBILITY
    get _shouldUpdateSelection() {
      return this.selected != null;
    },

    _checkFallback: function() {
      this._updateSelected();
    },

    _addListener: function(eventName) {
      this.listen(this, eventName, '_activateHandler');
    },

    _removeListener: function(eventName) {
      this.unlisten(this, eventName, '_activateHandler');
    },

    _activateEventChanged: function(eventName, old) {
      this._removeListener(old);
      this._addListener(eventName);
    },

    _updateItems: function() {
      var nodes = Polymer.dom(this).queryDistributedElements(this.selectable || '*');
      nodes = Array.prototype.filter.call(nodes, this._bindFilterItem);
      this._setItems(nodes);
    },

    _updateAttrForSelected: function() {
      if (this.selectedItem) {
        this.selected = this._valueForItem(this.selectedItem);
      }
    },

    _updateSelected: function() {
      this._selectSelected(this.selected);
    },

    _selectSelected: function(selected) {
      if (!this.items) {
        return;
      }

      var item = this._valueToItem(this.selected);
      if (item) {
        this._selection.select(item);
      } else {
        this._selection.clear();
      }
      // Check for items, since this array is populated only when attached
      // Since Number(0) is falsy, explicitly check for undefined
      if (this.fallbackSelection && this.items.length && (this._selection.get() === undefined)) {
        this.selected = this.fallbackSelection;
      }
    },

    _filterItem: function(node) {
      return !this._excludedLocalNames[node.localName];
    },

    _valueToItem: function(value) {
      return (value == null) ? null : this.items[this._valueToIndex(value)];
    },

    _valueToIndex: function(value) {
      if (this.attrForSelected) {
        for (var i = 0, item; item = this.items[i]; i++) {
          if (this._valueForItem(item) == value) {
            return i;
          }
        }
      } else {
        return Number(value);
      }
    },

    _indexToValue: function(index) {
      if (this.attrForSelected) {
        var item = this.items[index];
        if (item) {
          return this._valueForItem(item);
        }
      } else {
        return index;
      }
    },

    _valueForItem: function(item) {
      if (!item) {
        return null;
      }

      var propValue = item[Polymer.CaseMap.dashToCamelCase(this.attrForSelected)];
      return propValue != undefined ? propValue : item.getAttribute(this.attrForSelected);
    },

    _applySelection: function(item, isSelected) {
      if (this.selectedClass) {
        this.toggleClass(this.selectedClass, isSelected, item);
      }
      if (this.selectedAttribute) {
        this.toggleAttribute(this.selectedAttribute, isSelected, item);
      }
      this._selectionChange();
      this.fire('iron-' + (isSelected ? 'select' : 'deselect'), {item: item});
    },

    _selectionChange: function() {
      this._setSelectedItem(this._selection.get());
    },

    // observe items change under the given node.
    _observeItems: function(node) {
      return Polymer.dom(node).observeNodes(function(mutation) {
        this._updateItems();
        this._updateSelected();

        // Let other interested parties know about the change so that
        // we don't have to recreate mutation observers everywhere.
        this.fire('iron-items-changed', mutation, {
          bubbles: false,
          cancelable: false
        });
      });
    },

    _activateHandler: function(e) {
      var t = e.target;
      var items = this.items;
      while (t && t != this) {
        var i = items.indexOf(t);
        if (i >= 0) {
          var value = this._indexToValue(i);
          this._itemActivate(value, t);
          return;
        }
        t = t.parentNode;
      }
    },

    _itemActivate: function(value, item) {
      if (!this.fire('iron-activate',
          {selected: value, item: item}, {cancelable: true}).defaultPrevented) {
        this.select(value);
      }
    }

  };
/**
   * @polymerBehavior Polymer.IronMultiSelectableBehavior
   */
  Polymer.IronMultiSelectableBehaviorImpl = {
    properties: {

      /**
       * If true, multiple selections are allowed.
       */
      multi: {
        type: Boolean,
        value: false,
        observer: 'multiChanged'
      },

      /**
       * Gets or sets the selected elements. This is used instead of `selected` when `multi`
       * is true.
       */
      selectedValues: {
        type: Array,
        notify: true,
        value: function() {
          return [];
        }
      },

      /**
       * Returns an array of currently selected items.
       */
      selectedItems: {
        type: Array,
        readOnly: true,
        notify: true,
        value: function() {
          return [];
        }
      },

    },

    observers: [
      '_updateSelected(selectedValues.splices)'
    ],

    /**
     * Selects the given value. If the `multi` property is true, then the selected state of the
     * `value` will be toggled; otherwise the `value` will be selected.
     *
     * @method select
     * @param {string|number} value the value to select.
     */
    select: function(value) {
      if (this.multi) {
        this._toggleSelected(value);
      } else {
        this.selected = value;
      }
    },

    multiChanged: function(multi) {
      this._selection.multi = multi;
      this._updateSelected();
    },

    // UNUSED, FOR API COMPATIBILITY
    get _shouldUpdateSelection() {
      return this.selected != null ||
        (this.selectedValues != null && this.selectedValues.length);
    },

    _updateAttrForSelected: function() {
      if (!this.multi) {
        Polymer.IronSelectableBehavior._updateAttrForSelected.apply(this);
      } else if (this.selectedItems && this.selectedItems.length > 0) {
        this.selectedValues = this.selectedItems.map(function(selectedItem) {
          return this._indexToValue(this.indexOf(selectedItem));
        }, this).filter(function(unfilteredValue) {
          return unfilteredValue != null;
        }, this);
      }
    },

    _updateSelected: function() {
      if (this.multi) {
        this._selectMulti(this.selectedValues);
      } else {
        this._selectSelected(this.selected);
      }
    },

    _selectMulti: function(values) {
      values = values || [];

      var selectedItems = (this._valuesToItems(values) || []).filter(function(item) {
        return item !== null && item !== undefined;
      });

      // clear all but the current selected items
      this._selection.clear(selectedItems);

      // select only those not selected yet
      for (var i = 0; i < selectedItems.length; i++) {
        this._selection.setItemSelected(selectedItems[i], true);
      }

      // Check for items, since this array is populated only when attached
      if (this.fallbackSelection && !this._selection.get().length) {
        var fallback = this._valueToItem(this.fallbackSelection);
        if (fallback) {
          this.select(this.fallbackSelection);
        }
      }
    },

    _selectionChange: function() {
      var s = this._selection.get();
      if (this.multi) {
        this._setSelectedItems(s);
        this._setSelectedItem(s.length ? s[0] : null);
      } else {
        if (s !== null && s !== undefined) {
          this._setSelectedItems([s]);
          this._setSelectedItem(s);
        } else {
          this._setSelectedItems([]);
          this._setSelectedItem(null);
        }
      }
    },

    _toggleSelected: function(value) {
      var i = this.selectedValues.indexOf(value);
      var unselected = i < 0;
      if (unselected) {
        this.push('selectedValues',value);
      } else {
        this.splice('selectedValues',i,1);
      }
    },

    _valuesToItems: function(values) {
      return (values == null) ? null : values.map(function(value) {
        return this._valueToItem(value);
      }, this);
    }
  };

  /** @polymerBehavior */
  Polymer.IronMultiSelectableBehavior = [
    Polymer.IronSelectableBehavior,
    Polymer.IronMultiSelectableBehaviorImpl
  ];
/**
   * `Polymer.IronMenuBehavior` implements accessible menu behavior.
   *
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronMenuBehavior
   */
  Polymer.IronMenuBehaviorImpl = {

    properties: {

      /**
       * Returns the currently focused item.
       * @type {?Object}
       */
      focusedItem: {
        observer: '_focusedItemChanged',
        readOnly: true,
        type: Object
      },

      /**
       * The attribute to use on menu items to look up the item title. Typing the first
       * letter of an item when the menu is open focuses that item. If unset, `textContent`
       * will be used.
       */
      attrForItemTitle: {
        type: String
      },

      disabled: {
        type: Boolean,
        value: false,
        observer: '_disabledChanged',
      },
    },

    _SEARCH_RESET_TIMEOUT_MS: 1000,

    _previousTabIndex: 0,

    hostAttributes: {
      'role': 'menu',
    },

    observers: [
      '_updateMultiselectable(multi)'
    ],

    listeners: {
      'focus': '_onFocus',
      'keydown': '_onKeydown',
      'iron-items-changed': '_onIronItemsChanged'
    },

    keyBindings: {
      'up': '_onUpKey',
      'down': '_onDownKey',
      'esc': '_onEscKey',
      'shift+tab:keydown': '_onShiftTabDown'
    },

    attached: function() {
      this._resetTabindices();
    },

    /**
     * Selects the given value. If the `multi` property is true, then the selected state of the
     * `value` will be toggled; otherwise the `value` will be selected.
     *
     * @param {string|number} value the value to select.
     */
    select: function(value) {
      // Cancel automatically focusing a default item if the menu received focus
      // through a user action selecting a particular item.
      if (this._defaultFocusAsync) {
        this.cancelAsync(this._defaultFocusAsync);
        this._defaultFocusAsync = null;
      }
      var item = this._valueToItem(value);
      if (item && item.hasAttribute('disabled')) return;
      this._setFocusedItem(item);
      Polymer.IronMultiSelectableBehaviorImpl.select.apply(this, arguments);
    },

    /**
     * Resets all tabindex attributes to the appropriate value based on the
     * current selection state. The appropriate value is `0` (focusable) for
     * the default selected item, and `-1` (not keyboard focusable) for all
     * other items.
     */
    _resetTabindices: function() {
      var selectedItem = this.multi ? (this.selectedItems && this.selectedItems[0]) : this.selectedItem;

      this.items.forEach(function(item) {
        item.setAttribute('tabindex', item === selectedItem ? '0' : '-1');
      }, this);
    },

    /**
     * Sets appropriate ARIA based on whether or not the menu is meant to be
     * multi-selectable.
     *
     * @param {boolean} multi True if the menu should be multi-selectable.
     */
    _updateMultiselectable: function(multi) {
      if (multi) {
        this.setAttribute('aria-multiselectable', 'true');
      } else {
        this.removeAttribute('aria-multiselectable');
      }
    },

    /**
     * Given a KeyboardEvent, this method will focus the appropriate item in the
     * menu (if there is a relevant item, and it is possible to focus it).
     *
     * @param {KeyboardEvent} event A KeyboardEvent.
     */
    _focusWithKeyboardEvent: function(event) {
      this.cancelDebouncer('_clearSearchText');

      var searchText = this._searchText || '';
      var key = event.key && event.key.length == 1 ? event.key :
          String.fromCharCode(event.keyCode);
      searchText += key.toLocaleLowerCase();

      var searchLength = searchText.length;

      for (var i = 0, item; item = this.items[i]; i++) {
        if (item.hasAttribute('disabled')) {
          continue;
        }

        var attr = this.attrForItemTitle || 'textContent';
        var title = (item[attr] || item.getAttribute(attr) || '').trim();

        if (title.length < searchLength) {
          continue;
        }

        if (title.slice(0, searchLength).toLocaleLowerCase() == searchText) {
          this._setFocusedItem(item);
          break;
        }
      }

      this._searchText = searchText;
      this.debounce('_clearSearchText', this._clearSearchText,
                    this._SEARCH_RESET_TIMEOUT_MS);
    },

    _clearSearchText: function() {
      this._searchText = '';
    },

    /**
     * Focuses the previous item (relative to the currently focused item) in the
     * menu, disabled items will be skipped.
     * Loop until length + 1 to handle case of single item in menu.
     */
    _focusPrevious: function() {
      var length = this.items.length;
      var curFocusIndex = Number(this.indexOf(this.focusedItem));

      for (var i = 1; i < length + 1; i++) {
        var item = this.items[(curFocusIndex - i + length) % length];
        if (!item.hasAttribute('disabled')) {
          var owner = Polymer.dom(item).getOwnerRoot() || document;
          this._setFocusedItem(item);

          // Focus might not have worked, if the element was hidden or not
          // focusable. In that case, try again.
          if (Polymer.dom(owner).activeElement == item) {
            return;
          }
        }
      }
    },

    /**
     * Focuses the next item (relative to the currently focused item) in the
     * menu, disabled items will be skipped.
     * Loop until length + 1 to handle case of single item in menu.
     */
    _focusNext: function() {
      var length = this.items.length;
      var curFocusIndex = Number(this.indexOf(this.focusedItem));

      for (var i = 1; i < length + 1; i++) {
        var item = this.items[(curFocusIndex + i) % length];
        if (!item.hasAttribute('disabled')) {
          var owner = Polymer.dom(item).getOwnerRoot() || document;
          this._setFocusedItem(item);

          // Focus might not have worked, if the element was hidden or not
          // focusable. In that case, try again.
          if (Polymer.dom(owner).activeElement == item) {
            return;
          }
        }
      }
    },

    /**
     * Mutates items in the menu based on provided selection details, so that
     * all items correctly reflect selection state.
     *
     * @param {Element} item An item in the menu.
     * @param {boolean} isSelected True if the item should be shown in a
     * selected state, otherwise false.
     */
    _applySelection: function(item, isSelected) {
      if (isSelected) {
        item.setAttribute('aria-selected', 'true');
      } else {
        item.removeAttribute('aria-selected');
      }
      Polymer.IronSelectableBehavior._applySelection.apply(this, arguments);
    },

    /**
     * Discretely updates tabindex values among menu items as the focused item
     * changes.
     *
     * @param {Element} focusedItem The element that is currently focused.
     * @param {?Element} old The last element that was considered focused, if
     * applicable.
     */
    _focusedItemChanged: function(focusedItem, old) {
      old && old.setAttribute('tabindex', '-1');
      if (focusedItem && !focusedItem.hasAttribute('disabled') && !this.disabled) {
        focusedItem.setAttribute('tabindex', '0');
        focusedItem.focus();
      }
    },

    /**
     * A handler that responds to mutation changes related to the list of items
     * in the menu.
     *
     * @param {CustomEvent} event An event containing mutation records as its
     * detail.
     */
    _onIronItemsChanged: function(event) {
      if (event.detail.addedNodes.length) {
        this._resetTabindices();
      }
    },

    /**
     * Handler that is called when a shift+tab keypress is detected by the menu.
     *
     * @param {CustomEvent} event A key combination event.
     */
    _onShiftTabDown: function(event) {
      var oldTabIndex = this.getAttribute('tabindex');

      Polymer.IronMenuBehaviorImpl._shiftTabPressed = true;

      this._setFocusedItem(null);

      this.setAttribute('tabindex', '-1');

      this.async(function() {
        this.setAttribute('tabindex', oldTabIndex);
        Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;
        // NOTE(cdata): polymer/polymer#1305
      }, 1);
    },

    /**
     * Handler that is called when the menu receives focus.
     *
     * @param {FocusEvent} event A focus event.
     */
    _onFocus: function(event) {
      if (Polymer.IronMenuBehaviorImpl._shiftTabPressed) {
        // do not focus the menu itself
        return;
      }

      // Do not focus the selected tab if the deepest target is part of the
      // menu element's local DOM and is focusable.
      var rootTarget = /** @type {?HTMLElement} */(
          Polymer.dom(event).rootTarget);
      if (rootTarget !== this && typeof rootTarget.tabIndex !== "undefined" && !this.isLightDescendant(rootTarget)) {
        return;
      }

      // clear the cached focus item
      this._defaultFocusAsync = this.async(function() {
        // focus the selected item when the menu receives focus, or the first item
        // if no item is selected
        var selectedItem = this.multi ? (this.selectedItems && this.selectedItems[0]) : this.selectedItem;

        this._setFocusedItem(null);

        if (selectedItem) {
          this._setFocusedItem(selectedItem);
        } else if (this.items[0]) {
          // We find the first none-disabled item (if one exists)
          this._focusNext();
        }
      });
    },

    /**
     * Handler that is called when the up key is pressed.
     *
     * @param {CustomEvent} event A key combination event.
     */
    _onUpKey: function(event) {
      // up and down arrows moves the focus
      this._focusPrevious();
      event.detail.keyboardEvent.preventDefault();
    },

    /**
     * Handler that is called when the down key is pressed.
     *
     * @param {CustomEvent} event A key combination event.
     */
    _onDownKey: function(event) {
      this._focusNext();
      event.detail.keyboardEvent.preventDefault();
    },

    /**
     * Handler that is called when the esc key is pressed.
     *
     * @param {CustomEvent} event A key combination event.
     */
    _onEscKey: function(event) {
      var focusedItem = this.focusedItem;
      if (focusedItem) {
        focusedItem.blur();
      }
    },

    /**
     * Handler that is called when a keydown event is detected.
     *
     * @param {KeyboardEvent} event A keyboard event.
     */
    _onKeydown: function(event) {
      if (!this.keyboardEventMatchesKeys(event, 'up down esc')) {
        // all other keys focus the menu item starting with that character
        this._focusWithKeyboardEvent(event);
      }
      event.stopPropagation();
    },

    // override _activateHandler
    _activateHandler: function(event) {
      Polymer.IronSelectableBehavior._activateHandler.call(this, event);
      event.stopPropagation();
    },

    /**
     * Updates this element's tab index when it's enabled/disabled.
     * @param {boolean} disabled
     */
    _disabledChanged: function(disabled) {
      if (disabled) {
        this._previousTabIndex = this.hasAttribute('tabindex') ? this.tabIndex : 0;
        this.removeAttribute('tabindex');  // No tabindex means not tab-able or select-able.
      } else if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', this._previousTabIndex);
      }
    }
  };

  Polymer.IronMenuBehaviorImpl._shiftTabPressed = false;

  /** @polymerBehavior Polymer.IronMenuBehavior */
  Polymer.IronMenuBehavior = [
    Polymer.IronMultiSelectableBehavior,
    Polymer.IronA11yKeysBehavior,
    Polymer.IronMenuBehaviorImpl
  ];
(function() {
      Polymer({
        is: 'paper-listbox',

        behaviors: [
          Polymer.IronMenuBehavior
        ],

        hostAttributes: {
          role: 'listbox'
        }
      });
    })();
/**
 * `iron-range-behavior` provides the behavior for something with a minimum to maximum range.
 *
 * @demo demo/index.html
 * @polymerBehavior
 */
 Polymer.IronRangeBehavior = {

  properties: {

    /**
     * The number that represents the current value.
     */
    value: {
      type: Number,
      value: 0,
      notify: true,
      reflectToAttribute: true
    },

    /**
     * The number that indicates the minimum value of the range.
     */
    min: {
      type: Number,
      value: 0,
      notify: true
    },

    /**
     * The number that indicates the maximum value of the range.
     */
    max: {
      type: Number,
      value: 100,
      notify: true
    },

    /**
     * Specifies the value granularity of the range's value.
     */
    step: {
      type: Number,
      value: 1,
      notify: true
    },

    /**
     * Returns the ratio of the value.
     */
    ratio: {
      type: Number,
      value: 0,
      readOnly: true,
      notify: true
    },
  },

  observers: [
    '_update(value, min, max, step)'
  ],

  _calcRatio: function(value) {
    return (this._clampValue(value) - this.min) / (this.max - this.min);
  },

  _clampValue: function(value) {
    return Math.min(this.max, Math.max(this.min, this._calcStep(value)));
  },

  _calcStep: function(value) {
    // polymer/issues/2493
    value = parseFloat(value);

    if (!this.step) {
      return value;
    }

    var numSteps = Math.round((value - this.min) / this.step);
    if (this.step < 1) {
     /**
      * For small values of this.step, if we calculate the step using
      * `Math.round(value / step) * step` we may hit a precision point issue
      * eg. 0.1 * 0.2 =  0.020000000000000004
      * http://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
      *
      * as a work around we can divide by the reciprocal of `step`
      */
      return numSteps / (1 / this.step) + this.min;
    } else {
      return numSteps * this.step + this.min;
    }
  },

  _validateValue: function() {
    var v = this._clampValue(this.value);
    this.value = this.oldValue = isNaN(v) ? this.oldValue : v;
    return this.value !== v;
  },

  _update: function() {
    this._validateValue();
    this._setRatio(this._calcRatio(this.value) * 100);
  }

};
Polymer({
    is: 'paper-progress',

    behaviors: [
      Polymer.IronRangeBehavior
    ],

    properties: {
      /**
       * The number that represents the current secondary progress.
       */
      secondaryProgress: {
        type: Number,
        value: 0
      },

      /**
       * The secondary ratio
       */
      secondaryRatio: {
        type: Number,
        value: 0,
        readOnly: true
      },

      /**
       * Use an indeterminate progress indicator.
       */
      indeterminate: {
        type: Boolean,
        value: false,
        observer: '_toggleIndeterminate'
      },

      /**
       * True if the progress is disabled.
       */
      disabled: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        observer: '_disabledChanged'
      }
    },

    observers: [
      '_progressChanged(secondaryProgress, value, min, max, indeterminate)'
    ],

    hostAttributes: {
      role: 'progressbar'
    },

    _toggleIndeterminate: function(indeterminate) {
      // If we use attribute/class binding, the animation sometimes doesn't translate properly
      // on Safari 7.1. So instead, we toggle the class here in the update method.
      this.toggleClass('indeterminate', indeterminate, this.$.primaryProgress);
    },

    _transformProgress: function(progress, ratio) {
      var transform = 'scaleX(' + (ratio / 100) + ')';
      progress.style.transform = progress.style.webkitTransform = transform;
    },

    _mainRatioChanged: function(ratio) {
      this._transformProgress(this.$.primaryProgress, ratio);
    },

    _progressChanged: function(secondaryProgress, value, min, max, indeterminate) {
      secondaryProgress = this._clampValue(secondaryProgress);
      value = this._clampValue(value);

      var secondaryRatio = this._calcRatio(secondaryProgress) * 100;
      var mainRatio = this._calcRatio(value) * 100;

      this._setSecondaryRatio(secondaryRatio);
      this._transformProgress(this.$.secondaryProgress, secondaryRatio);
      this._transformProgress(this.$.primaryProgress, mainRatio);

      this.secondaryProgress = secondaryProgress;

      if (indeterminate) {
        this.removeAttribute('aria-valuenow');
      } else {
        this.setAttribute('aria-valuenow', value);
      }
      this.setAttribute('aria-valuemin', min);
      this.setAttribute('aria-valuemax', max);
    },

    _disabledChanged: function(disabled) {
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    },

    _hideSecondaryProgress: function(secondaryRatio) {
      return secondaryRatio === 0;
    }
  });
Polymer({
      is: 'paper-radio-button',

      behaviors: [
        Polymer.PaperCheckedElementBehavior
      ],

      hostAttributes: {
        role: 'radio',
        'aria-checked': false,
        tabindex: 0
      },

      properties: {
        /**
         * Fired when the checked state changes due to user interaction.
         *
         * @event change
         */

        /**
         * Fired when the checked state changes.
         *
         * @event iron-change
         */

        ariaActiveAttribute: {
          type: String,
          value: 'aria-checked'
        }
      },

      ready: function() {
        this._rippleContainer = this.$.radioContainer;
      },

      attached: function() {
        // Wait until styles have resolved to check for the default sentinel.
        // See polymer#4009 for more details.
        Polymer.RenderStatus.afterNextRender(this, function() {
          var inkSize = this.getComputedStyleValue('--calculated-paper-radio-button-ink-size').trim();
          // If unset, compute and set the default `--paper-radio-button-ink-size`.
          if (inkSize === '-1px') {
            var size = parseFloat(this.getComputedStyleValue('--calculated-paper-radio-button-size').trim());
            var defaultInkSize = Math.floor(3 * size);

            // The button and ripple need to have the same parity so that their
            // centers align.
            if (defaultInkSize % 2 !== size % 2) {
              defaultInkSize++;
            }

            this.updateStyles({
              '--paper-radio-button-ink-size': defaultInkSize + 'px',
            });
          }
        });
      },
    });
/**
   * `Polymer.IronMenubarBehavior` implements accessible menubar behavior.
   *
   * @polymerBehavior Polymer.IronMenubarBehavior
   */
  Polymer.IronMenubarBehaviorImpl = {

    hostAttributes: {
      'role': 'menubar'
    },

    keyBindings: {
      'left': '_onLeftKey',
      'right': '_onRightKey'
    },

    _onUpKey: function(event) {
      this.focusedItem.click();
      event.detail.keyboardEvent.preventDefault();
    },

    _onDownKey: function(event) {
      this.focusedItem.click();
      event.detail.keyboardEvent.preventDefault();
    },

    get _isRTL() {
      return window.getComputedStyle(this)['direction'] === 'rtl';
    },

    _onLeftKey: function(event) {
      if (this._isRTL) {
        this._focusNext();
      } else {
        this._focusPrevious();
      }
      event.detail.keyboardEvent.preventDefault();
    },

    _onRightKey: function(event) {
      if (this._isRTL) {
        this._focusPrevious();
      } else {
        this._focusNext();
      }
      event.detail.keyboardEvent.preventDefault();
    },

    _onKeydown: function(event) {
      if (this.keyboardEventMatchesKeys(event, 'up down left right esc')) {
        return;
      }

      // all other keys focus the menu item starting with that character
      this._focusWithKeyboardEvent(event);
    }

  };

  /** @polymerBehavior Polymer.IronMenubarBehavior */
  Polymer.IronMenubarBehavior = [
    Polymer.IronMenuBehavior,
    Polymer.IronMenubarBehaviorImpl
  ];
Polymer({
    is: 'paper-radio-group',

    behaviors: [
      Polymer.IronMenubarBehavior
    ],

    hostAttributes: {
      role: 'radiogroup',
      tabindex: 0
    },

    properties: {
      /**
       * Fired when the radio group selection changes.
       *
       * @event paper-radio-group-changed
       */

      /**
       * Overriden from Polymer.IronSelectableBehavior
       */
      attrForSelected: {
        type: String,
        value: 'name'
      },

      /**
       * Overriden from Polymer.IronSelectableBehavior
       */
      selectedAttribute: {
        type: String,
        value: 'checked'
      },

      /**
       * Overriden from Polymer.IronSelectableBehavior
       */
      selectable: {
        type: String,
        value: 'paper-radio-button'
      },

      /**
       * If true, radio-buttons can be deselected
       */
      allowEmptySelection: {
        type: Boolean,
        value: false
      }
    },

    /**
     * Selects the given value.
     */
    select: function(value) {
      var newItem = this._valueToItem(value);
      if (newItem && newItem.hasAttribute('disabled')) {
        return;
      }

      if (this.selected) {
        var oldItem = this._valueToItem(this.selected);

        if (this.selected == value) {
          // If deselecting is allowed we'll have to apply an empty selection.
          // Otherwise, we should force the selection to stay and make this
          // action a no-op.
          if (this.allowEmptySelection) {
            value = '';
          } else {
            if (oldItem)
              oldItem.checked = true;
            return;
          }
        }

        if (oldItem)
          oldItem.checked = false;
      }

      Polymer.IronSelectableBehavior.select.apply(this, [value]);
      this.fire('paper-radio-group-changed');
    },

    _activateFocusedItem: function() {
      this._itemActivate(this._valueForItem(this.focusedItem), this.focusedItem);
    },

    _onUpKey: function(event) {
      this._focusPrevious();
      event.preventDefault();
      this._activateFocusedItem();
    },

    _onDownKey: function(event) {
      this._focusNext();
      event.preventDefault();
      this._activateFocusedItem();
    },

    _onLeftKey: function(event) {
      Polymer.IronMenubarBehaviorImpl._onLeftKey.apply(this, arguments);
      this._activateFocusedItem();
    },

    _onRightKey: function(event) {
      Polymer.IronMenubarBehaviorImpl._onRightKey.apply(this, arguments);
      this._activateFocusedItem();
    }
  });
/** @polymerBehavior */
  Polymer.PaperSpinnerBehavior = {

    properties: {
      /**
       * Displays the spinner.
       */
      active: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        observer: '__activeChanged'
      },

      /**
       * Alternative text content for accessibility support.
       * If alt is present, it will add an aria-label whose content matches alt when active.
       * If alt is not present, it will default to 'loading' as the alt value.
       */
      alt: {
        type: String,
        value: 'loading',
        observer: '__altChanged'
      },

      __coolingDown: {
        type: Boolean,
        value: false
      }
    },

    __computeContainerClasses: function(active, coolingDown) {
      return [
        active || coolingDown ? 'active' : '',
        coolingDown ? 'cooldown' : ''
      ].join(' ');
    },

    __activeChanged: function(active, old) {
      this.__setAriaHidden(!active);
      this.__coolingDown = !active && old;
    },

    __altChanged: function(alt) {
      // user-provided `aria-label` takes precedence over prototype default
      if (alt === 'loading') {
        this.alt = this.getAttribute('aria-label') || alt;
      } else {
        this.__setAriaHidden(alt==='');
        this.setAttribute('aria-label', alt);
      }
    },

    __setAriaHidden: function(hidden) {
      var attr = 'aria-hidden';
      if (hidden) {
        this.setAttribute(attr, 'true');
      } else {
        this.removeAttribute(attr);
      }
    },

    __reset: function() {
      this.active = false;
      this.__coolingDown = false;
    }
  };
Polymer({
      is: 'paper-spinner',

      behaviors: [
        Polymer.PaperSpinnerBehavior
      ]
    });
Polymer({
      is: 'paper-icon-button',

      hostAttributes: {
        role: 'button',
        tabindex: '0'
      },

      behaviors: [
        Polymer.PaperInkyFocusBehavior
      ],

      properties: {
        /**
         * The URL of an image for the icon. If the src property is specified,
         * the icon property should not be.
         */
        src: {
          type: String
        },

        /**
         * Specifies the icon name or index in the set of icons available in
         * the icon's icon set. If the icon property is specified,
         * the src property should not be.
         */
        icon: {
          type: String
        },

        /**
         * Specifies the alternate text for the button, for accessibility.
         */
        alt: {
          type: String,
          observer: "_altChanged"
        }
      },

      _altChanged: function(newValue, oldValue) {
        var label = this.getAttribute('aria-label');

        // Don't stomp over a user-set aria-label.
        if (!label || oldValue == label) {
          this.setAttribute('aria-label', newValue);
        }
      }
    });
Polymer({
      is: 'paper-swatch-picker',

      hostAttributes: {
        'tabindex': 0
      },

      listeners: {
        'paper-dropdown-open': '_onOpen',
        'iron-select': '_onColorTap'
      },

      /**
       * Fired when a color has been selected
       *
       * @event color-picker-selected
       */

      properties: {
        /**
         * The selected color, as hex (i.e. #ffffff).
         * value.
         */
        color: {
          type: String,
          notify: true,
          observer: '_colorChanged'
        },

        /**
         * The colors to be displayed. By default, these are the Material Design
         * colors. This array is arranged by "generic color", so for example,
         * all the reds (from light to dark), then the pinks, then the blues, etc.
         * Depending on how many of these generic colors you have, you should
         * update the `columnCount` property.
         */
        colorList: {
          type: Array,
          value: function() {
            return ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c', '#fce4ec', '#f8bbd0', '#f48fb1', '#f06292', '#ec407a', '#e91e63', '#d81b60', '#c2185b', '#ad1457', '#880e4f', '#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c', '#ede7f6', '#d1c4e9', '#b39ddb', '#9575cd', '#7e57c2', '#673ab7', '#5e35b1', '#512da8', '#4527a0', '#311b92', '#e8eaf6', '#c5cae9', '#9fa8da', '#7986cb', '#5c6bc0', '#3f51b5', '#3949ab', '#303f9f', '#283593', '#1a237e', '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6', '#03a9f4', '#039be5', '#0288d1', '#0277bd', '#01579b', '#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#26c6da', '#00bcd4', '#00acc1', '#0097a7', '#00838f', '#006064', '#e0f2f1', '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a', '#009688', '#00897b', '#00796b', '#00695c', '#004d40', '#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20', '#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581', '#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f', '#33691e', '#f9fbe7', '#f0f4c3', '#e6ee9c', '#dce775', '#d4e157', '#cddc39', '#c0ca33', '#afb42b', '#9e9d24', '#827717', '#fffde7', '#fff9c4', '#fff59d', '#fff176', '#ffee58', '#ffeb3b', '#fdd835', '#fbc02d', '#f9a825', '#f57f17', '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f', '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00', '#ff6f00', '#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100', '#fbe9e7', '#ffccbc', '#ffab91', '#ff8a65', '#ff7043', '#ff5722', '#f4511e', '#e64a19', '#d84315', '#bf360c', '#efebe9', '#d7ccc8', '#bcaaa4', '#a1887f', '#8d6e63', '#795548', '#6d4c41', '#5d4037', '#4e342e', '#3e2723', '#fafafa', '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#212121'];
          }
        },

        /* The number of columns to display in the picker. This corresponds to
         * the number of generic colors (i.e. not counting the light/dark) variants
         * of a specific color) you are using in your `colorList`. For example,
         * the Material Design palette has 18 colors */
        columnCount: {
          type: Number,
          value: 18
        },

        /**
         * The orientation against which to align the menu dropdown
         * horizontally relative to the dropdown trigger.
         */
        horizontalAlign: {
          type: String,
          value: 'left',
          reflectToAttribute: true
        },

        /**
         * The orientation against which to align the menu dropdown
         * vertically relative to the dropdown trigger.
         */
        verticalAlign: {
          type: String,
          value: 'top',
          reflectToAttribute: true
        },

        /**
         * If true, the color picker button will not produce a ripple effect when interacted
         * with via the pointer.
         */
        noink: {
          type: Boolean
        }
      },

      created: function() {
        // Note: we won't actually render these color boxes unless the menu is
        // actually tapped.
        this._renderedColors = false;
      },

      attached: function() {
        // Fit the color boxes in columns. We first need to get the width of
        // a color box (which is customizable), and then change the box's
        // width to fit all the columns.
        var sizeOfAColorDiv = this.getComputedStyleValue('--paper-swatch-picker-color-size');
        if (!sizeOfAColorDiv || sizeOfAColorDiv == '') {  // Default value case
          sizeOfAColorDiv = 20;
        } else {
          sizeOfAColorDiv = sizeOfAColorDiv.replace('px', '');
        }

        var rowCount = this.colorList.length / this.columnCount;
        this.$.container.style.height = rowCount * sizeOfAColorDiv + 'px';
        this.$.container.style.width = this.columnCount * sizeOfAColorDiv + 'px';
      },

      _onOpen: function() {
        // Fill in the colors if we haven't already.
        if (this._renderedColors)
          return;

        var colorBoxes = this.$.container.querySelectorAll('.color');
        for (var i = 0; i < colorBoxes.length; i++) {
          colorBoxes[i].style.color = colorBoxes[i].innerHTML;
          colorBoxes[i].innerHTML = '';
        }
        this._renderedColors = true;
      },

      _addOverflowClass: function() {
        this.$.container.toggleClass('opened', true);
      },

      _removeOverflowClass: function() {
        this.$.container.toggleClass('opened', false);
      },

      _onColorTap: function(event) {
        var item = event.detail.item;
        // The inner `span` element has the background color;
        var color = item.style.color;

        // If it's in rgb format, convert it first.
        this.color = color.indexOf('rgb') === -1 ? color : this._rgbToHex(color);
        this.fire('color-picker-selected', {color: this.color});
      },

      _colorChanged: function() {
        this.$.iconButton.style.color = this.color;
      },

      /**
       * Takes an rgb(r, g, b) style string and converts it to a #ffffff hex value.
       */
      _rgbToHex: function(rgb) {
        // Split the rgb(r, g, b) string up.
        var split = rgb.split('(')[1].split(')')[0].split(',');

        if (split.length != 3)
          return '';

        // From https://gist.github.com/lrvick/2080648.
        var bin = split[0] << 16 | split[1] << 8 | split[2];
        return (function(h) {
          return '#' + new Array(7 - h.length).join('0') + h;
        })(bin.toString(16).toLowerCase());
      }
    });
(function() {
      'use strict';

      // Keeps track of the toast currently opened.
      var currentToast = null;

      Polymer({
        is: 'paper-toast',

        behaviors: [
          Polymer.IronOverlayBehavior
        ],

        properties: {
          /**
           * The element to fit `this` into.
           * Overridden from `Polymer.IronFitBehavior`.
           */
          fitInto: {
            type: Object,
            value: window,
            observer: '_onFitIntoChanged'
          },

          /**
           * The orientation against which to align the dropdown content
           * horizontally relative to `positionTarget`.
           * Overridden from `Polymer.IronFitBehavior`.
           */
          horizontalAlign: {
            type: String,
            value: 'left'
          },

          /**
           * The orientation against which to align the dropdown content
           * vertically relative to `positionTarget`.
           * Overridden from `Polymer.IronFitBehavior`.
           */
          verticalAlign: {
            type: String,
            value: 'bottom'
          },

          /**
           * The duration in milliseconds to show the toast.
           * Set to `0`, a negative number, or `Infinity`, to disable the
           * toast auto-closing.
           */
          duration: {
            type: Number,
            value: 3000
          },

          /**
           * The text to display in the toast.
           */
          text: {
            type: String,
            value: ''
          },

          /**
           * Overridden from `IronOverlayBehavior`.
           * Set to false to enable closing of the toast by clicking outside it.
           */
          noCancelOnOutsideClick: {
            type: Boolean,
            value: true
          },

          /**
           * Overridden from `IronOverlayBehavior`.
           * Set to true to disable auto-focusing the toast or child nodes with
           * the `autofocus` attribute` when the overlay is opened.
           */
          noAutoFocus: {
            type: Boolean,
            value: true
          }
        },

        listeners: {
          'transitionend': '__onTransitionEnd'
        },

        /**
         * Read-only. Deprecated. Use `opened` from `IronOverlayBehavior`.
         * @property visible
         * @deprecated
         */
        get visible() {
          Polymer.Base._warn('`visible` is deprecated, use `opened` instead');
          return this.opened;
        },

        /**
         * Read-only. Can auto-close if duration is a positive finite number.
         * @property _canAutoClose
         */
        get _canAutoClose() {
          return this.duration > 0 && this.duration !== Infinity;
        },

        created: function() {
          this._autoClose = null;
          Polymer.IronA11yAnnouncer.requestAvailability();
        },

        /**
         * Show the toast. Without arguments, this is the same as `open()` from `IronOverlayBehavior`.
         * @param {(Object|string)=} properties Properties to be set before opening the toast.
         * e.g. `toast.show('hello')` or `toast.show({text: 'hello', duration: 3000})`
         */
        show: function(properties) {
          if (typeof properties == 'string') {
            properties = { text: properties };
          }
          for (var property in properties) {
            if (property.indexOf('_') === 0) {
              Polymer.Base._warn('The property "' + property + '" is private and was not set.');
            } else if (property in this) {
              this[property] = properties[property];
            } else {
              Polymer.Base._warn('The property "' + property + '" is not valid.');
            }
          }
          this.open();
        },

        /**
         * Hide the toast. Same as `close()` from `IronOverlayBehavior`.
         */
        hide: function() {
          this.close();
        },

        /**
         * Called on transitions of the toast, indicating a finished animation
         * @private
         */
        __onTransitionEnd: function(e) {
          // there are different transitions that are happening when opening and
          // closing the toast. The last one so far is for `opacity`.
          // This marks the end of the transition, so we check for this to determine if this
          // is the correct event.
          if (e && e.target === this && e.propertyName === 'opacity') {
            if (this.opened) {
              this._finishRenderOpened();
            } else {
              this._finishRenderClosed();
            }
          }
        },

        /**
         * Overridden from `IronOverlayBehavior`.
         * Called when the value of `opened` changes.
         */
        _openedChanged: function() {
          if (this._autoClose !== null) {
            this.cancelAsync(this._autoClose);
            this._autoClose = null;
          }
          if (this.opened) {
            if (currentToast && currentToast !== this) {
              currentToast.close();
            }
            currentToast = this;
            this.fire('iron-announce', {
              text: this.text
            });
            if (this._canAutoClose) {
              this._autoClose = this.async(this.close, this.duration);
            }
          } else if (currentToast === this) {
            currentToast = null;
          }
          Polymer.IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
        },

        /**
         * Overridden from `IronOverlayBehavior`.
         */
        _renderOpened: function() {
          this.classList.add('paper-toast-open');
        },

        /**
         * Overridden from `IronOverlayBehavior`.
         */
        _renderClosed: function() {
          this.classList.remove('paper-toast-open');
        },

        /**
         * @private
         */
        _onFitIntoChanged: function(fitInto) {
          this.positionTarget = fitInto;
        }

        /**
         * Fired when `paper-toast` is opened.
         *
         * @event 'iron-announce'
         * @param {{text: string}} detail Contains text that will be announced.
         */
      });
    })();
Polymer({
      is: 'paper-tooltip',

      hostAttributes: {
        role: 'tooltip',
        tabindex: -1
      },

      behaviors: [
        Polymer.NeonAnimationRunnerBehavior
      ],

      properties: {
        /**
         * The id of the element that the tooltip is anchored to. This element
         * must be a sibling of the tooltip.
         */
        for: {
          type: String,
          observer: '_findTarget'
        },

        /**
         * Set this to true if you want to manually control when the tooltip
         * is shown or hidden.
         */
        manualMode: {
          type: Boolean,
          value: false,
          observer: '_manualModeChanged'
        },

        /**
         * Positions the tooltip to the top, right, bottom, left of its content.
         */
        position: {
          type: String,
          value: 'bottom'
        },

        /**
         * If true, no parts of the tooltip will ever be shown offscreen.
         */
        fitToVisibleBounds: {
          type: Boolean,
          value: false
        },

        /**
         * The spacing between the top of the tooltip and the element it is
         * anchored to.
         */
        offset: {
          type: Number,
          value: 14
        },

        /**
         * This property is deprecated, but left over so that it doesn't
         * break exiting code. Please use `offset` instead. If both `offset` and
         * `marginTop` are provided, `marginTop` will be ignored.
         * @deprecated since version 1.0.3
         */
        marginTop: {
          type: Number,
          value: 14
        },

        /**
         * The delay that will be applied before the `entry` animation is
         * played when showing the tooltip.
         */
        animationDelay: {
          type: Number,
          value: 500
        },

        /**
         * The entry and exit animations that will be played when showing and
         * hiding the tooltip. If you want to override this, you must ensure
         * that your animationConfig has the exact format below.
         */
        animationConfig: {
          type: Object,
          value: function() {
            return {
              'entry': [{
                name: 'fade-in-animation',
                node: this,
                timing: {delay: 0}
              }],
              'exit': [{
                name: 'fade-out-animation',
                node: this
              }]
            }
          }
        },

        _showing: {
          type: Boolean,
          value: false
        }
      },

      listeners: {
        'neon-animation-finish': '_onAnimationFinish',
      },

      /**
       * Returns the target element that this tooltip is anchored to. It is
       * either the element given by the `for` attribute, or the immediate parent
       * of the tooltip.
       */
      get target () {
        var parentNode = Polymer.dom(this).parentNode;
        // If the parentNode is a document fragment, then we need to use the host.
        var ownerRoot = Polymer.dom(this).getOwnerRoot();

        var target;
        if (this.for) {
          target = Polymer.dom(ownerRoot).querySelector('#' + this.for);
        } else {
          target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ?
              ownerRoot.host : parentNode;
        }

        return target;
      },

      attached: function() {
        this._findTarget();
      },

      detached: function() {
        if (!this.manualMode)
          this._removeListeners();
      },

      show: function() {
        // If the tooltip is already showing, there's nothing to do.
        if (this._showing)
          return;

        if (Polymer.dom(this).textContent.trim() === ''){
          // Check if effective children are also empty
          var allChildrenEmpty = true;
          var effectiveChildren = Polymer.dom(this).getEffectiveChildNodes();
          for (var i = 0; i < effectiveChildren.length; i++) {
            if (effectiveChildren[i].textContent.trim() !== '') {
              allChildrenEmpty = false;
              break;
            }
          }
          if (allChildrenEmpty) {
            return;
          }
        }


        this.cancelAnimation();
        this._showing = true;
        this.toggleClass('hidden', false, this.$.tooltip);
        this.updatePosition();

        this.animationConfig.entry[0].timing = this.animationConfig.entry[0].timing || {};
        this.animationConfig.entry[0].timing.delay = this.animationDelay;
        this._animationPlaying = true;
        this.playAnimation('entry');
      },

      hide: function() {
        // If the tooltip is already hidden, there's nothing to do.
        if (!this._showing) {
          return;
        }

        // If the entry animation is still playing, don't try to play the exit
        // animation since this will reset the opacity to 1. Just end the animation.
        if (this._animationPlaying) {
          this.cancelAnimation();
          this._showing = false;
          this._onAnimationFinish();
          return;
        }

        this._showing = false;
        this._animationPlaying = true;
        this.playAnimation('exit');
      },

      updatePosition: function() {
        if (!this._target || !this.offsetParent)
          return;

        var offset = this.offset;
        // If a marginTop has been provided by the user (pre 1.0.3), use it.
        if (this.marginTop != 14 && this.offset == 14)
          offset = this.marginTop;

        var parentRect = this.offsetParent.getBoundingClientRect();
        var targetRect = this._target.getBoundingClientRect();
        var thisRect = this.getBoundingClientRect();

        var horizontalCenterOffset = (targetRect.width - thisRect.width) / 2;
        var verticalCenterOffset = (targetRect.height - thisRect.height) / 2;

        var targetLeft = targetRect.left - parentRect.left;
        var targetTop = targetRect.top - parentRect.top;

        var tooltipLeft, tooltipTop;

        switch (this.position) {
          case 'top':
            tooltipLeft = targetLeft + horizontalCenterOffset;
            tooltipTop = targetTop - thisRect.height - offset;
            break;
          case 'bottom':
            tooltipLeft = targetLeft + horizontalCenterOffset;
            tooltipTop = targetTop + targetRect.height + offset;
            break;
          case 'left':
            tooltipLeft = targetLeft - thisRect.width - offset;
            tooltipTop = targetTop + verticalCenterOffset;
            break;
          case 'right':
            tooltipLeft = targetLeft + targetRect.width + offset;
            tooltipTop = targetTop + verticalCenterOffset;
            break;
        }

        // TODO(noms): This should use IronFitBehavior if possible.
        if (this.fitToVisibleBounds) {
          // Clip the left/right side
          if (parentRect.left + tooltipLeft + thisRect.width > window.innerWidth) {
            this.style.right = '0px';
            this.style.left = 'auto';
          } else {
            this.style.left = Math.max(0, tooltipLeft) + 'px';
            this.style.right = 'auto';
          }

          // Clip the top/bottom side.
          if (parentRect.top + tooltipTop + thisRect.height > window.innerHeight) {
            this.style.bottom = parentRect.height + 'px';
            this.style.top = 'auto';
          } else {
            this.style.top = Math.max(-parentRect.top, tooltipTop) + 'px';
            this.style.bottom = 'auto';
          }
        } else {
          this.style.left = tooltipLeft + 'px';
          this.style.top = tooltipTop + 'px';
        }

      },

      _addListeners: function() {
        if (this._target) {
          this.listen(this._target, 'mouseenter', 'show');
          this.listen(this._target, 'focus', 'show');
          this.listen(this._target, 'mouseleave', 'hide');
          this.listen(this._target, 'blur', 'hide');
          this.listen(this._target, 'tap', 'hide');
        }
        this.listen(this, 'mouseenter', 'hide');
      },

      _findTarget: function() {
        if (!this.manualMode)
          this._removeListeners();

        this._target = this.target;

        if (!this.manualMode)
          this._addListeners();
      },

      _manualModeChanged: function() {
        if (this.manualMode)
          this._removeListeners();
        else
          this._addListeners();
      },

      _onAnimationFinish: function() {
        this._animationPlaying = false;
        if (!this._showing) {
          this.toggleClass('hidden', true, this.$.tooltip);
        }
      },

      _removeListeners: function() {
        if (this._target) {
          this.unlisten(this._target, 'mouseenter', 'show');
          this.unlisten(this._target, 'focus', 'show');
          this.unlisten(this._target, 'mouseleave', 'hide');
          this.unlisten(this._target, 'blur', 'hide');
          this.unlisten(this._target, 'tap', 'hide');
        }
        this.unlisten(this, 'mouseenter', 'hide');
      }
    });
(function() {

		function capitalizeFirstLetter(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		Polymer({

			is: 'social-media-icons',

			properties: {

				/**
				 * The `icon` attribute grabs a vector-shaped logo of social media you choose
				 *
				 * @attribute icon
				 * @type string
				 * @default 'github'
				 */

				icon: {
					type: String,
					value: 'github',
					notify: true,
					reflectToAttribute: true,
					observer: '_getPath'
				},

				/**
				 * The `size` attribute sets a size of an element
				 *
				 * @attribute size
				 * @type int
				 * @default 32
				 */

				size: {
					type: Number,
					value: 32,
					notify: true,
					reflectToAttribute: true
				},

				/**
				 * The `color` attribute fills the shape with a color you choose
				 *
				 * @attribute color
				 * @type hex
				 * @default undefined
				 */

				color: {
					type: String,
					notify: true,
					reflectToAttribute: true
				},

				/**
				 * The `title` attribute changes the title
				 *
				 * @attribute change
				 * @type string
				 */

				title: {
					type: String,
					notify: true,
					reflectToAttribute: true
				}
			},

			_setWidthAndHeight: function(size) {
				return 'width: ' + size + 'px; height: ' + size + 'px;';
			},

			_setTitle: function(icon) {
				return capitalizeFirstLetter(icon) + ' Logo';
			},

			_getTitle: function(title, icon) {
				return (icon.length > 0) ? this.title : _setTitle(icon);
			},

			_getPath: function() {
				switch (this.icon) {
					case 'dribbble':
						this.path =
							'M16,32C7.2,32,0,24.8,0,16C0,7.2,7.2,0,16,0c8.8,0,16,7.2,16,16C32,24.8,24.8,32,16,32L16,32z M29.5,18.2 C29,18,25.3,16.9,21,17.6c1.8,4.9,2.5,8.9,2.7,9.7C26.7,25.3,28.9,22,29.5,18.2L29.5,18.2z M21.3,28.6c-0.2-1.2-1-5.4-2.9-10.4 c0,0-0.1,0-0.1,0c-7.7,2.7-10.5,8-10.7,8.5c 2.3,1.8,5.2,2.9,8.4,2.9C17.9,29.7,19.7,29.3,21.3,28.6L21.3,28.6z M5.8,25.2 c0.3-0.5,4.1-6.7,11.1-9c0.2-0.1,0.4-0.1,0.5-0.2c-0.3-0.8-0.7-1.6-1.1-2.3c-6.8,2-13.4,2-14,1.9c0,0.1,0,0.3,0,0.4 C2.3,19.5,3.7,22.7,5.8,25.2L5.8,25.2z M2.6,13.2c0.6,0,6.2,0,12.6-1.7c-2.3-4-4.7-7.4-5.1-7.9C6.4,5.5,3.5,9,2.6,13.2L2.6,13.2z M12.8,2.7c0.4,0.5,2.9,3.9,5.1,8c4.9-1.8,6.9-4.6,7.2-4.9c-2.4-2.1-5.6-3.4-9.1-3.4C14.9,2.4,13.8,2.5,12.8,2.7L12.8,2.7z M26.6,7.4c-0.3,0.4-2.6,3.3-7.6,5.4c0.3,0.7,0.6,1.3,0.9,2c0.1,0.2,0.2,0.5,0.3,0.7c4.5-0.6,9.1,0.3,9.5,0.4 C29.6,12.7,28.5,9.7,26.6,7.4L26.6,7.4z';
						break;

					case 'facebook':
						this.path =
							'M30.2,0H1.8C0.8,0,0,0.8,0,1.8v28.5c0,1,0.8,1.8,1.8,1.8h15.3V19.6h-4.2v-4.8h4.2v-3.6 c0-4.1,2.5-6.4,6.2-6.4C25.1,4.8,26.6,5,27,5v4.3l-2.6,0c-2,0-2.4,1-2.4,2.4v3.1h4.8l-0.6,4.8h-4.2V32h8.2c1,0,1.8-0.8,1.8-1.8V1.8 C32,0.8,31.2,0,30.2,0z';
						break;

					case 'github':
						this.path =
							'M16,0.4c-8.8,0-16,7.2-16,16c0,7.1,4.6,13.1,10.9,15.2 c0.8,0.1,1.1-0.3,1.1-0.8c0-0.4,0-1.4,0-2.7c-4.5,1-5.4-2.1-5.4-2.1c-0.7-1.8-1.8-2.3-1.8-2.3c-1.5-1,0.1-1,0.1-1 c1.6,0.1,2.5,1.6,2.5,1.6c1.4,2.4,3.7,1.7,4.7,1.3c0.1-1,0.6-1.7,1-2.1c-3.6-0.4-7.3-1.8-7.3-7.9c0-1.7,0.6-3.2,1.6-4.3 c-0.2-0.4-0.7-2,0.2-4.2c0,0,1.3-0.4,4.4,1.6c1.3-0.4,2.6-0.5,4-0.5c1.4,0,2.7,0.2,4,0.5C23.1,6.6,24.4,7,24.4,7 c0.9,2.2,0.3,3.8,0.2,4.2c1,1.1,1.6,2.5,1.6,4.3c0,6.1-3.7,7.5-7.3,7.9c0.6,0.5,1.1,1.5,1.1,3c0,2.1,0,3.9,0,4.4 c0,0.4,0.3,0.9,1.1,0.8C27.4,29.5,32,23.5,32,16.4C32,7.6,24.8,0.4,16,0.4z';
						break;

					case 'googleplus':
						this.path =
							'M32,14.7h-3.3v-3.3H26v3.3h-3.3v2.7H26v3.3h2.7v-3.3H32 M10.7,14v4.2h5.8c-0.4,2.5-2.6,4.3-5.8,4.3c-3.5,0-6.4-3-6.4-6.5 s2.9-6.5,6.4-6.5c1.6,0,3,0.5,4.1,1.6v0l3-3c-1.8-1.7-4.3-2.8-7.1-2.8C4.8,5.3,0,10.1,0,16s4.8,10.7,10.7,10.7 c6.2,0,10.2-4.3,10.2-10.4c0-0.8-0.1-1.5-0.2-2.2C20.7,14,10.7,14,10.7,14z';
						break;

					case 'instagram':
						this.path =
							'M28.2,0H3.8C1.7,0,0,1.7,0,3.8v24.4C0,30.3,1.7,32,3.8,32h24.4c2.1,0,3.8-1.7,3.8-3.8V3.8 C32,1.7,30.3,0,28.2,0z M22.2,4.5c0-0.5,0.4-0.9,0.9-0.9h4.3c0.5,0,0.9,0.4,0.9,0.9v4.3c0,0.5-0.4,0.9-0.9,0.9h-4.3 c-0.5,0-0.9-0.4-0.9-0.9V4.5z M16,9.9c3.4,0,6.2,2.7,6.2,6.1c0,3.4-2.8,6.1-6.2,6.1c-3.4,0-6.2-2.7-6.2-6.1 C9.9,12.6,12.6,9.9,16,9.9z M28.4,27.4c0,0.5-0.4,0.9-0.9,0.9h-23c-0.5,0-0.9-0.4-0.9-0.9V13.5h3c-0.2,0.8-0.3,1.7-0.3,2.6 c0,5.4,4.4,9.7,9.7,9.7c5.4,0,9.7-4.4,9.7-9.7c0-0.9-0.1-1.7-0.3-2.6h3V27.4z';
						break;

					case 'lastfm':
						this.path =
							'M14.1,22.9l-1.2-3.2c0,0-1.9,2.1-4.8,2.1c-2.5,0-4.3-2.2-4.3-5.7c0-4.5,2.3-6.1,4.5-6.1 c3.2,0,4.3,2.1,5.1,4.8l1.2,3.7c1.2,3.6,3.4,6.4,9.7,6.4c4.5,0,7.6-1.4,7.6-5.1c0-3-1.7-4.5-4.8-5.2l-2.3-0.5 c-1.6-0.4-2.1-1-2.1-2.1c0-1.2,1-2,2.6-2c1.8,0,2.7,0.7,2.9,2.2l3.7-0.4c-0.3-3.3-2.6-4.7-6.3-4.7c-3.3,0-6.5,1.2-6.5,5.2 c0,2.5,1.2,4.1,4.3,4.8l2.5,0.6c1.9,0.4,2.5,1.2,2.5,2.3c0,1.4-1.3,1.9-3.8,1.9c-3.7,0-5.2-1.9-6.1-4.6l-1.2-3.7 c-1.5-4.8-4-6.5-8.9-6.5C2.9,7.1,0,10.5,0,16.3c0,5.6,2.9,8.6,8,8.6C12.1,24.9,14.1,22.9,14.1,22.9L14.1,22.9z';
						break;

					case 'linkedin':
						this.path =
							'M29.6,0H2.4C1.1,0,0,1,0,2.3v27.4C0,31,1.1,32,2.4,32h27.3c1.3,0,2.4-1,2.4-2.3V2.3C32,1,30.9,0,29.6,0z M9.5,27.3H4.7V12h4.7V27.3z M7.1,9.9c-1.5,0-2.8-1.2-2.8-2.8c0-1.5,1.2-2.8,2.8-2.8c1.5,0,2.8,1.2,2.8,2.8 C9.9,8.7,8.6,9.9,7.1,9.9z M27.3,27.3h-4.7v-7.4c0-1.8,0-4-2.5-4c-2.5,0-2.8,1.9-2.8,3.9v7.6h-4.7V12H17v2.1h0.1 c0.6-1.2,2.2-2.5,4.5-2.5c4.8,0,5.7,3.2,5.7,7.3V27.3z';
						break;

					case 'medium':
						this.path =
							'M32,7.1h-1.3c-0.5,0-1.1,0.7-1.1,1.1v15.7c0,0.4,0.7,1,1.1,1H32v3.7H20.5v-3.7h2.4V8.4h-0.1l-5.6,20.3h-4.3 L7.3,8.4H7.2v16.5h2.4v3.7H0v-3.7h1.2c0.5,0,1.2-0.6,1.2-1V8.2c0-0.4-0.7-1.1-1.2-1.1H0V3.3h12L15.9,18h0.1l4-14.7h12V7.1z';
						break;

					case 'quora':
						this.path =
							'M23.2,26.6C23.2,26.6,23.2,26.5,23.2,26.6c4-2.5,6.7-7,6.7-12.4C29.9,3.7,23.1,0,16,0 C9.4,0,2.1,5.2,2.1,14.3c0,10.4,6.8,14.3,13.8,14.3c1.1,0,2.2-0.1,3.2-0.4c0,0,0,0,0,0c2.8,5,6.9,3.8,8,3.4c0,0-0.1-0.9-0.4-2.5 C24.8,29,23.9,28,23.2,26.6z M17.8,24.9c-0.6,0.2-1.3,0.2-1.9,0.2c-3.3,0-7.2-1.4-7.2-10.3c0-8.9,4.1-11.3,7.4-11.3 c3.3,0,7.1,2.1,7.1,11c0,4-0.8,6.6-2,8.2c0,0,0,0,0,0c-2.7-3.5-6.3-2.7-7.1-2.3c0,0,0.1,0.8,0.3,2.3 C16.3,22.6,17.2,23.6,17.8,24.9C17.8,24.8,17.8,24.9,17.8,24.9z';
						break;

					case 'pinterest':
						this.path =
							'M16,0C7.2,0,0,7.2,0,16c0,6.8,4.2,12.6,10.2,14.9c-0.1-1.3-0.3-3.2,0.1-4.6c0.3-1.2,1.9-8,1.9-8 s-0.5-1-0.5-2.4c0-2.2,1.3-3.9,2.9-3.9c1.4,0,2,1,2,2.3c0,1.4-0.9,3.4-1.3,5.3c-0.4,1.6,0.8,2.9,2.4,2.9c2.8,0,5-3,5-7.3 c0-3.8-2.8-6.5-6.7-6.5c-4.6,0-7.2,3.4-7.2,6.9c0,1.4,0.5,2.8,1.2,3.7c0.1,0.2,0.1,0.3,0.1,0.5c-0.1,0.5-0.4,1.6-0.4,1.8 C9.5,21.9,9.3,22,9,21.8c-2-0.9-3.2-3.9-3.2-6.2c0-5,3.7-9.7,10.6-9.7c5.6,0,9.9,4,9.9,9.2c0,5.5-3.5,10-8.3,10 c-1.6,0-3.1-0.8-3.7-1.8c0,0-0.8,3.1-1,3.8c-0.4,1.4-1.3,3.1-2,4.2c1.5,0.5,3.1,0.7,4.7,0.7c8.8,0,16-7.2,16-16 C32,7.2,24.8,0,16,0z';
						break;

					case 'skype':
						this.path =
							'M30.9,18.7c0.2-0.9,0.3-1.8,0.3-2.7c0-2-0.4-4-1.2-5.9c-0.8-1.8-1.8-3.4-3.2-4.8c-1.4-1.4-3-2.5-4.8-3.2 C20,1.2,18,0.8,16,0.8c-1,0-1.9,0.1-2.9,0.3c0,0,0,0,0,0c-1.3-0.7-2.7-1-4.2-1C6.6,0,4.3,1,2.6,2.7C0.9,4.3,0,6.6,0,9 c0,1.5,0.4,3,1.1,4.3c-0.1,0.9-0.2,1.7-0.2,2.6c0,2,0.4,4,1.2,5.9c0.8,1.8,1.8,3.4,3.2,4.8c1.4,1.4,3,2.5,4.8,3.2 C12,30.6,14,31,16,31c0.9,0,1.8-0.1,2.6-0.2c1.3,0.8,2.9,1.2,4.4,1.2c2.4,0,4.6-0.9,6.3-2.6c1.7-1.7,2.6-3.9,2.6-6.3 C32,21.5,31.6,20,30.9,18.7z M16.1,25.2c-5.4,0-7.8-2.6-7.8-4.6c0-1,0.7-1.7,1.8-1.7c2.3,0,1.7,3.3,6,3.3c2.2,0,3.4-1.2,3.4-2.4 c0-0.7-0.4-1.5-1.8-1.9l-4.8-1.2c-3.8-1-4.5-3-4.5-5c0-4.1,3.8-5.6,7.4-5.6c3.3,0,7.2,1.8,7.2,4.3c0,1-0.9,1.6-1.9,1.6 c-2,0-1.6-2.7-5.5-2.7c-2,0-3,0.9-3,2.2c0,1.3,1.5,1.7,2.9,2l3.5,0.8c3.9,0.9,4.9,3.1,4.9,5.3C23.7,22.7,21.2,25.2,16.1,25.2z';
						break;

					case 'spotify':
						this.path =
							'M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16c8.8,0,16-7.2,16-16 S24.8,0,16,0z M13.7,8.4c4.7,0,9.6,1,13.3,3.1c0.5,0.3,0.8,0.7,0.8,1.5c0,0.9-0.7,1.5-1.5,1.5c-0.3,0-0.5-0.1-0.8-0.2 c-2.9-1.7-7.4-2.7-11.7-2.7c-2.2,0-4.4,0.2-6.4,0.8c-0.2,0.1-0.5,0.2-0.8,0.2c-0.9,0-1.5-0.7-1.5-1.5c0-0.9,0.5-1.4,1.1-1.5 C8.3,8.7,10.9,8.4,13.7,8.4z M13.3,13.8c4.2,0,8.2,1,11.4,2.9c0.5,0.3,0.7,0.7,0.7,1.3c0,0.7-0.6,1.3-1.2,1.3 c-0.3,0-0.6-0.1-0.8-0.3c-2.6-1.5-6.2-2.6-10.2-2.6c-2,0-3.8,0.3-5.2,0.7c-0.3,0.1-0.5,0.2-0.8,0.2c-0.7,0-1.2-0.6-1.2-1.3 c0-0.7,0.3-1.1,1-1.3C8.8,14.2,10.7,13.8,13.3,13.8z M13.5,19.1c3.5,0,6.6,0.8,9.3,2.4c0.4,0.2,0.6,0.5,0.6,1.1c0,0.6-0.5,1-1,1 c-0.3,0-0.4-0.1-0.7-0.2c-2.3-1.4-5.2-2.1-8.3-2.1c-1.7,0-3.4,0.2-5,0.6c-0.3,0.1-0.6,0.2-0.8,0.2c-0.6,0-1-0.5-1-1 c0-0.7,0.4-1,0.9-1.1C9.5,19.3,11.5,19.1,13.5,19.1z';
						break;

					case 'stumbleupon':
						this.path =
							'M16,0C7.2,0,0,7.2,0,16c0,8.8,7.2,16,16,16c8.8,0,16-7.2,16-16C32,7.2,24.8,0,16,0z M15.8,12.1 c-0.5,0-1,0.4-1,1l0,5.8c0,2.2-1.8,4-4.1,4c-2.3,0-4.1-1.8-4.1-4.1c0,0,0-2.5,0-2.5h3.1v2.5c0,0.5,0.4,1,1,1s1-0.4,1-1v-5.9 c0.1-2.2,1.9-3.9,4.1-3.9c2.2,0,4,1.8,4.1,4v1.3L18,14.8l-1.3-0.6v-1.1C16.8,12.6,16.4,12.1,15.8,12.1z M25,18.9 c0,2.3-1.8,4.1-4.1,4.1c-2.2,0-4.1-1.8-4.1-4.1v-2.6l1.3,0.6l1.9-0.6V19c0,0.5,0.4,1,1,1s1-0.4,1-1v-2.6H25 C25,16.3,25,18.8,25,18.9z';
						break;

					case 'tumblr':
						this.path =
							'M23.7,25.6c-0.6,0.3-1.7,0.5-2.6,0.6C18.5,26.2,18,24.3,18,23V13h6.4V8.2H18V0c0,0-4.6,0-4.7,0 c-0.1,0-0.2,0.1-0.2,0.2c-0.3,2.5-1.4,6.9-6.3,8.6V13H10v10.5c0,3.6,2.6,8.7,9.6,8.5c2.4,0,5-1,5.5-1.9L23.7,25.6z';
						break;

					case 'twitter':
						this.path =
							'M32,6.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6C25.7,3.8,24,3,22.2,3 c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5C10.3,10.8,5.5,8.2,2.2,4.2c-0.6,1-0.9,2.1-0.9,3.3c0,2.3,1.2,4.3,2.9,5.5 c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1C2.9,27.9,6.4,29,10.1,29c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C30,8.5,31.1,7.4,32,6.1z';
						break;

					case 'youtube':
						this.path =
							'M31.7,9.6c0,0-0.3-2.2-1.3-3.2c-1.2-1.3-2.6-1.3-3.2-1.4C22.7,4.7,16,4.7,16,4.7h0c0,0-6.7,0-11.2,0.3 c-0.6,0.1-2,0.1-3.2,1.4c-1,1-1.3,3.2-1.3,3.2S0,12.2,0,14.8v2.4c0,2.6,0.3,5.2,0.3,5.2s0.3,2.2,1.3,3.2c1.2,1.3,2.8,1.2,3.5,1.4 C7.7,27.2,16,27.3,16,27.3s6.7,0,11.2-0.3c0.6-0.1,2-0.1,3.2-1.4c1-1,1.3-3.2,1.3-3.2s0.3-2.6,0.3-5.2v-2.4 C32,12.2,31.7,9.6,31.7,9.6z M12.7,20.2l0-9l8.6,4.5L12.7,20.2z';
						break;

					case 'vimeo':
						this.path =
							'M32,8.5c-0.1,3.1-2.3,7.4-6.5,12.8c-4.4,5.7-8,8.5-11,8.5c-1.9,0-3.4-1.7-4.7-5.2c-0.9-3.2-1.7-6.3-2.6-9.5 c-1-3.4-2-5.2-3.1-5.2c-0.2,0-1.1,0.5-2.5,1.5L0,9.6c1.6-1.4,3.1-2.8,4.7-4.2c2.1-1.8,3.7-2.8,4.7-2.9c2.5-0.2,4,1.5,4.6,5.1 c0.6,3.9,1.1,6.4,1.3,7.3c0.7,3.3,1.5,4.9,2.4,4.9c0.7,0,1.7-1.1,3-3.2c1.3-2.1,2.1-3.7,2.2-4.8c0.2-1.8-0.5-2.7-2.2-2.7 c-0.8,0-1.6,0.2-2.4,0.5c1.6-5.2,4.6-7.7,9-7.5C30.6,2.2,32.2,4.4,32,8.5z';
						break;

					case 'vine':
						this.path =
							'M30,15.9c-0.8,0.2-1.6,0.3-2.3,0.3c-4,0-7.1-2.8-7.1-7.7c0-2.4,0.9-3.7,2.2-3.7c1.3,0,2.1,1.1,2.1,3.4 c0,1.3-0.3,2.7-0.6,3.6c0,0,1.2,2.2,4.6,1.5c0.7-1.6,1.1-3.7,1.1-5.5C30,2.9,27.5,0,22.9,0c-4.7,0-7.5,3.6-7.5,8.4 c0,4.7,2.2,8.8,5.9,10.6c-1.5,3.1-3.5,5.8-5.5,7.8c-3.7-4.5-7-10.4-8.4-22H2c2.5,19.3,10,25.5,12,26.7c1.1,0.7,2.1,0.6,3.1,0.1 c1.6-0.9,6.4-5.7,9.1-11.4c1.1,0,2.5-0.1,3.8-0.4V15.9z';
						break;
				}
			},

			_renderSVG: function() {
				var svg = Polymer.dom(this.$.svg);
				var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

				Polymer.dom(path).setAttribute('fill', this.color);
				Polymer.dom(path).setAttribute('d', this.path);

				svg.appendChild(path);
			},

			// Fires when the `<social-media-icons>` has been fully prepared
			ready: function() {
				// If `color` is not defined in Light DOM, fill the icon with brand color
				if (!this.color) {
					switch (this.icon) {
						case 'dribbble':
							this.color = '#EA4C89';
							break;
						case 'facebook':
							this.color = '#3B5998';
							break;
						case 'github':
							this.color = '#171515';
							break;
						case 'googleplus':
							this.color = '#DB4E3F';
							break;
						case 'instagram':
							this.color = '#3F729B';
							break;
						case 'jsfiddle':
							this.color = '#4679BD';
							break;
						case 'lastfm':
							this.color = '#D51007';
							break;
						case 'linkedin':
							this.color = '#0077B5';
							break;
						case 'medium':
							this.color = '#231F20';
							break;
						case 'quora':
							this.color = '#A72723';
							break;
						case 'pinterest':
							this.color = '#CB2027';
							break;
						case 'skype':
							this.color = '#00AFF0';
							break;
						case 'spotify':
							this.color = '#6AE368';
							break;
						case 'stumbleupon':
							this.color = '#EF4E23';
							break;
						case 'tumblr':
							this.color = '#35465C';
							break;
						case 'twitter':
							this.color = '#55ACEE';
							break;
						case 'youtube':
							this.color = '#E52D27';
							break;
						case 'vimeo':
							this.color = '#1AB7EA';
							break;
						case 'vine':
							this.color = '#00B489';
							break;
						default:
							this.color = '#000000';
							break;
					}
				}

				this._renderSVG();
			}
		});

	})();
