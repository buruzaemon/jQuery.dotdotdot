/*
 * jQuery dotdotdot 1.7.4
 *
 * Copyright (c) Fred Heusschen
 * www.frebsite.nl
 *
 * Plugin website:
 * dotdotdot.frebsite.nl
 *
 * Licensed under the MIT license.
 * http://en.wikipedia.org/wiki/MIT_License
 *
 * ----------------------------------------
 *
 * TinySegmenter 0.2 -- Super compact Japanese tokenizer in Javascript
 * (c) 2008 Taku Kudo <taku@chasen.org>
 *
 * TinySegmenter is freely distributable under the terms of a new BSD licence.
 *
 * For details, see http://chasen.org/~taku/software/TinySegmenter/LICENCE.txt
 */

(function($, undef) {

    if ($.fn.dotdotdot) {
        return;
    }

    $.fn.dotdotdot = function(o) {
        if (this.length === 0) {
            $.fn.dotdotdot.debug('No element found for "' + this.selector + '".');
            return this;
        }
        if (this.length > 1) {
            return this.each( function() { $(this).dotdotdot(o); });
        }

        var $dot = this;

        if ($dot.data('dotdotdot')) {
            $dot.trigger('destroy.dot');
        }

        $dot.data('dotdotdot-style', $dot.attr('style') || '');
        $dot.css('word-wrap', 'break-word');
        if ($dot.css('white-space') === 'nowrap') {
            $dot.css('white-space', 'normal');
        }

        $dot.bind_events = function() {
            $dot.bind(
                'update.dot',
                function(e, c) {
                    $dot.removeClass("is-truncated");
                    e.preventDefault();
                    e.stopPropagation();

                    switch(typeof opts.height) {
                        case 'number':
                            opts.maxHeight = opts.height;
                            break;

                        case 'function':
                            opts.maxHeight = opts.height.call($dot[ 0 ]);
                            break;

                        default:
                            opts.maxHeight = getTrueInnerHeight($dot);
                            break;
                    }

                    opts.maxHeight += opts.tolerance;

                    if (typeof c !== 'undefined') {
                        if (typeof c === 'string' || ('nodeType' in c && c.nodeType === 1)) {
                            c = $('<div />').append(c).contents();
                        }
                        if (c instanceof $) {
                            orgContent = c;
                        }
                    }

                    $inr = $dot.wrapInner('<div class="dotdotdot" />').children();
                    $inr.contents()
                    .detach()
                    .end()
                    .append(orgContent.clone(true))
                    .find('br')
                    .replaceWith('  <br />  ')
                    .end()
                    .css({  'height'    : 'auto',
                            'width'     : 'auto',
                            'border'    : 'none',
                            'padding'   : 0,
                            'margin'    : 0
                    });

                    var after = false,
                    trunc = false;

                    if (conf.afterElement) {
                        after = conf.afterElement.clone(true);
                        after.show();
                        conf.afterElement.detach();
                    }

                    if (test($inr, opts)) {
                        if (opts.wrap === 'children') {
                            trunc = children($inr, opts, after);
                        }
                        else {
                            trunc = ellipsis($inr, $dot, $inr, opts, after);
                        }
                    }
                    $inr.replaceWith($inr.contents());
                    $inr = null;

                    if ($.isFunction(opts.callback)) {
                        opts.callback.call($dot[ 0 ], trunc, orgContent);
                    }

                    conf.isTruncated = trunc;
                    return trunc;
                }
           ).bind('isTruncated.dot', function(e, fn) {
               e.preventDefault();
               e.stopPropagation();

               if (typeof fn === 'function') {
                   fn.call($dot[ 0 ], conf.isTruncated);
               }
               return conf.isTruncated;
           }

           ).bind('originalContent.dot', function(e, fn) {
               e.preventDefault();
               e.stopPropagation();

               if (typeof fn === 'function') {
                   fn.call($dot[ 0 ], orgContent);
               }
               return orgContent;
           }

           ).bind('destroy.dot', function(e) {
               e.preventDefault();
               e.stopPropagation();

               $dot.unwatch()
               .unbind_events()
               .contents()
               .detach()
               .end()
               .append(orgContent)
               .attr('style', $dot.data('dotdotdot-style') || '')
               .data('dotdotdot', false);
           });
           
           return $dot;
        }; // bind_events

        $dot.unbind_events = function() {
            $dot.unbind('.dot');
            return $dot;
        }; // unbind_events

        $dot.watch = function() {
            $dot.unwatch();
            if (opts.watch === 'window') {
                var $window = $(window),
                _wWidth = $window.width(),
                _wHeight = $window.height();

                $window.bind('resize.dot' + conf.dotId, function() {
                   if (_wWidth !== $window.width() || _wHeight !== $window.height() || !opts.windowResizeFix)  {
                       _wWidth = $window.width();
                       _wHeight = $window.height();

                       if (watchInt) {
                           clearInterval(watchInt);
                       }
                       watchInt = setTimeout(function() {
                          $dot.trigger('update.dot');
                       }, 100);
                    }
                });
            }
            else {
                watchOrg = getSizes($dot);
                watchInt = setInterval(function() {
                    if ($dot.is(':visible')) {
                        var watchNew = getSizes($dot);
                        if (watchOrg.width  !== watchNew.width ||
                            watchOrg.height !== watchNew.height)
                        {
                            $dot.trigger('update.dot');
                            watchOrg = watchNew;
                        }
                    }
                }, 500);
            }
            return $dot;
        };

        $dot.unwatch = function() {
            $(window).unbind('resize.dot' + conf.dotId);
            if (watchInt) {
                clearInterval(watchInt);
            }
            return $dot;
        };

        var orgContent = $dot.contents(),
        opts           = $.extend(true, {}, $.fn.dotdotdot.defaults, o),
        conf           = {},
        watchOrg       = {},
        watchInt       = null,
        $inr           = null;


        if (!(opts.lastCharacter.remove instanceof Array)) {
            opts.lastCharacter.remove = $.fn.dotdotdot.defaultArrays.lastCharacter.remove;
        }
        if (!(opts.lastCharacter.noEllipsis instanceof Array)) {
            opts.lastCharacter.noEllipsis = $.fn.dotdotdot.defaultArrays.lastCharacter.noEllipsis;
        }

        conf.afterElement   = getElement(opts.after, $dot);
        conf.isTruncated    = false;
        conf.dotId          = dotId++;

        $dot.data('dotdotdot', true)
        .bind_events()
        .trigger('update.dot');

        if (opts.watch) {
            $dot.watch();
        }

        return $dot;
    };

    // public
    $.fn.dotdotdot.defaults = {
        'ellipsis'          : '... ',
        'wrap'              : 'word',
        'fallbackToLetter'  : true,
        'lastCharacter'     : {},
        'tolerance'         : 0,
        'callback'          : null,
        'after'             : null,
        'height'            : null,
        'watch'             : false,
        'windowResizeFix'   : true
    };
    $.fn.dotdotdot.defaultArrays = {
        'lastCharacter'     : {
            'remove'            : [ ' ', '\u3000', ',', ';', '.', '!', '?' ],
            'noEllipsis'        : []
        }
    };
    $.fn.dotdotdot.debug = function(msg) {};

    // private
    var dotId = 1;

    function children($elem, o, after) {
        var $elements = $elem.children(),
        isTruncated   = false;

        $elem.empty();

        for (var a = 0, l = $elements.length; a < l; a++) {
            var $e = $elements.eq(a);
            $elem.append($e);
            if (after) {
                $elem.append(after);
            }
            if (test($elem, o)) {
                $e.remove();
                isTruncated = true;
                break;
            }
            else {
                if (after) {
                    after.detach();
                }
            }
        }
        return isTruncated;
    }
    function ellipsis($elem, $d, $i, o, after) {
        var isTruncated = false;

        // Don't put the ellipsis directly inside these elements
        var notx = 'a, table, thead, tbody, tfoot, tr, col, colgroup, object, embed, param, ol, ul, dl, blockquote, select, optgroup, option, textarea, script, style';

        // Don't remove these elements even if they are after the ellipsis
        var noty = 'script, .dotdotdot-keep';

        $elem
        .contents()
        .detach()
        .each( function() {
           var e = this,
           $e    = $(e);

           if (typeof e == 'undefined') {
               return true;
           }
           else if ($e.is(noty)) {
               $elem.append($e);
           }
           else if (isTruncated) {
               return true;
           }
           else {
               $elem.append($e);
               if (after && !$e.is(o.after) && !$e.find(o.after).length ) {
                   $elem[ $elem.is(notx) ? 'after' : 'append' ](after);
               }
               if (test($i, o)) {
                   // node is TEXT
                   if (e.nodeType == 3) {
                       isTruncated = ellipsisElement($e, $d, $i, o, after);
                   }
                   else {
                       isTruncated = ellipsis($e, $d, $i, o, after);
                   }

                   if (!isTruncated) {
                       $e.detach();
                       isTruncated = true;
                   }
               }

               if (!isTruncated) {
                   if (after) {
                       after.detach();
                   }
               }
           }
        });
        $d.addClass("is-truncated");
        return isTruncated;
    }
    function ellipsisElement($e, $d, $i, o, after) {
        var e = $e[0];

        if (!e) {
            return false;
        }

        var tiny = new TinySegmenter();

        var txt     = getTextContent(e),
        space       = (txt.indexOf(' ') !== -1) ? ' ' : '\u3000',
        separator   = (o.wrap == 'letter') ? '' : space,
        textArr     = tiny.segment(txt),
        position    = -1,
        midPos      = -1,
        startPos    = 0,
        endPos      = textArr.length - 1;

        // Only one word
        if (o.fallbackToLetter && startPos === 0 && endPos === 0) {
            separator   = '';
            textArr     = tiny.segment(txt);
            endPos      = textArr.length - 1;
        }

        while (startPos <= endPos && !(startPos === 0 && endPos === 0)) {
            var m = Math.floor((startPos + endPos) / 2);
            if (m === midPos) {
                break;
            }
            midPos = m;

            var chunk = joinChars(textArr.slice(0, midPos + 1));
            setTextContent(e, chunk + o.ellipsis);
            $i.children()
            .each(function() {
                $(this).toggle().toggle();
            });

            if (!test($i, o)) {
                position = midPos;
                startPos = midPos;
            }
            else {
                endPos = midPos;

                // Fallback to letter
                if (o.fallbackToLetter && startPos === 0 && endPos === 0) {
                    separator   = '';
                    textArr     = tiny.segment(textArr[0]);
                    position    = -1;
                    midPos      = -1;
                    startPos    = 0;
                    endPos      = textArr.length - 1;
                }
            }
        }

        if (position !== -1 && !(textArr.length === 1 && textArr[ 0 ].length === 0)) {
            var chunk = joinChars(textArr.slice(0, position+1));
            txt = addEllipsis(chunk, o);
            setTextContent(e, txt);
        }
        else {
            var $w = $e.parent();
            $e.detach();

            var afterLength = (after && after.closest($w).length) ? after.length : 0;

            if ($w.contents().length > afterLength) {
                e = findLastTextNode($w.contents().eq(-1 - afterLength), $d);
            }
            else {
                e = findLastTextNode($w, $d, true);
                if (!afterLength) {
                    $w.detach();
                }
            }
            if (e) {
                txt = addEllipsis(getTextContent(e), o);
                setTextContent(e, txt);
                if (afterLength && after) {
                    $(e).parent().append(after);
                }
            }
        }

        return true;
    }
    function test($i, o) {
        return $i.innerHeight() > o.maxHeight;
    }
    function addEllipsis(txt, o) {
        while($.inArray(txt.slice(-1), o.lastCharacter.remove) > -1) {
            txt = txt.slice(0, -1);
        }
        if ($.inArray(txt.slice(-1), o.lastCharacter.noEllipsis) < 0) {
            txt += o.ellipsis;
        }
        return txt;
    }
    function getSizes($d) {
        return {
            'width' : $d.innerWidth(),
            'height': $d.innerHeight()
        };
    }
    function setTextContent(e, content) {
        if (e.innerText) {
            e.innerText = content;
        }
        else if (e.nodeValue) {
            e.nodeValue = content;
        }
        else if (e.textContent) {
            e.textContent = content;
        }
    }
    function getTextContent(e) {
        if (e.innerText) {
            return e.innerText;
        }
        else if (e.nodeValue) {
            return e.nodeValue;
        }
        else if (e.textContent) {
            return e.textContent;
        }
        else {
            return "";
        }
    }
    function getPrevNode(n) {
        do {
            n = n.previousSibling;
        } while (n && n.nodeType !== 1 && n.nodeType !== 3);

        return n;
    }
    function findLastTextNode($el, $top, excludeCurrent) {
        var e = $el && $el[0], p;
        if (e) {
            if (!excludeCurrent) {
                if (e.nodeType === 3) {
                    return e;
                }
                if ($.trim($el.text())) {
                    return findLastTextNode($el.contents().last(), $top);
                }
            }
            p = getPrevNode(e);
            while (!p) {
                $el = $el.parent();
                if ($el.is($top) || !$el.length) {
                    return false;
                }
                p = getPrevNode($el[0]);
            }
            if (p) {
                return findLastTextNode($(p), $top);
            }
        }
        return false;
    }
    function getElement(e, $i) {
        if (!e) {
            return false;
        }
        if (typeof e === 'string') {
            e = $(e, $i);
            return (e.length)
            ? e
            : false;
        }
        return !e.jquery
        ? false
        : e;
    }
    function getTrueInnerHeight($el) {
        var h = $el.innerHeight(),
        a = ['paddingTop', 'paddingBottom'];

        for (var z = 0, l = a.length; z < l; z++) {
            var m = parseInt($el.css(a[ z ]), 10);
            if (isNaN(m)) {
                m = 0;
            }
            h -= m;
        }
        return h;
    }
    // c.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
    function fixedCharCodeAt(str, idx) {
        idx = idx || 0;
        var code = str.charCodeAt(idx);
        var hi, low;

        if (0xD800 <= code && code <= 0xDBFF) {
            hi = code
            low = str.charCodeAt(idx + 1);
            if (isNaN(low)) {
                throw 'High surrogate not followed by low surrogate in fixedCharCodeAt()';
            }
            return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }
        if (0xDC00 <= code && code <= 0xDFF) { // low surrogate
            return false;
        }
        return code;
    }
    function joinChars(tArr) {
        var tmp = [];
        for (var i = 0, l = tArr.length; i < l; i++) {
            tmp.push(tArr[i]);
            if (i < l-1) {
                var c1 = fixedCharCodeAt(tArr[i], tArr[i].length-1);
                var c2 = fixedCharCodeAt(tArr[i+1], 0);
                if (!(isJaCharCode(c1) || isJaCharCode(c2))) {
                    tmp.push(' ');
                }
            }
        }
        return tmp.join('');
    }
    function isJaCharCode(c) {
        return ((0x3000 <= c && c <= 0x305F) || (0x3040 <= c && c <= 0xFF9F));
    }

    // override jQuery.html
    var _orgHtml = $.fn.html;
    $.fn.html = function(str) {
        if (str !== undef && !$.isFunction(str) && this.data('dotdotdot')) {
            return this.trigger('update', [ str ]);
        }
        return _orgHtml.apply(this, arguments);
    };

    // override jQuery.text
    var _orgText = $.fn.text;
    $.fn.text = function(str) {
        if (str !== undef && !$.isFunction(str) && this.data('dotdotdot')) {
            str = $('<div />').text(str).html();
            return this.trigger('update', [ str ]);
        }
        return _orgText.apply(this, arguments);
    };

    function TinySegmenter() {
        var patterns = {
            "[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u5104\u5146]":"M",
            "[\u4e00-\u9fa0\u3005\u3006\u30f5\u30f6]":"H",
            "[\u3041-\u3093]":"I",
            "[\u30a1-\u30f4\u30fc\uff71-\uff9d\uff9e\uff70]":"K",
            "[a-zA-Z0-9\uff10-\uff19\uff41-\uff5a\uff21-\uff3a\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~]":"A"
        }

        this.chartype_ = [];
        for (var i in patterns) {
            var regexp = new RegExp;
            regexp.compile(i)
            this.chartype_.push([regexp, patterns[i]]);
        }

        this.BIAS__ = -332
        this.BC1__ = {"HH":6,"II":2461,"KH":406,"OH":-1378};
        this.BC2__ = {"AA":-3267,"AI":2744,"AN":-878,"HH":-4070,"HM":-1711,"HN":4012,"HO":3761,"IA":1327,"IH":-1184,"II":-1332,"IK":1721,"IO":5492,"KI":3831,"KK":-8741,"MH":-3132,"MK":3334,"OO":-2920};
        this.BC3__ = {"HH":996,"HI":626,"HK":-721,"HN":-1307,"HO":-836,"IH":-301,"KK":2762,"MK":1079,"MM":4034,"OA":-1652,"OH":266};
        this.BP1__ = {"BB":295,"OB":304,"OO":-125,"UB":352};
        this.BP2__ = {"BO":60,"OO":-1762};
        this.BQ1__ = {"BHH":1150,"BHM":1521,"BII":-1158,"BIM":886,"BMH":1208,"BNH":449,"BOH":-91,"BOO":-2597,"OHI":451,"OIH":-296,"OKA":1851,"OKH":-1020,"OKK":904,"OOO":2965};
        this.BQ2__ = {"BHH":118,"BHI":-1159,"BHM":466,"BIH":-919,"BKK":-1720,"BKO":864,"OHH":-1139,"OHM":-181,"OIH":153,"UHI":-1146};
        this.BQ3__ = {"BHH":-792,"BHI":2664,"BII":-299,"BKI":419,"BMH":937,"BMM":8335,"BNN":998,"BOH":775,"OHH":2174,"OHM":439,"OII":280,"OKH":1798,"OKI":-793,"OKO":-2242,"OMH":-2402,"OOO":11699};
        this.BQ4__ = {"BHH":-3895,"BIH":3761,"BII":-4654,"BIK":1348,"BKK":-1806,"BMI":-3385,"BOO":-12396,"OAH":926,"OHH":266,"OHK":-2036,"ONN":-973};
        this.BW1__ = {",\u3068":660,",\u540c":727,"B1\u3042":1404,"B1\u540c":542,"\u3001\u3068":660,"\u3001\u540c":727,"\u300d\u3068":1682,"\u3042\u3063":1505,"\u3044\u3046":1743,"\u3044\u3063":-2055,"\u3044\u308b":672,"\u3046\u3057":-4817,"\u3046\u3093":665,"\u304b\u3089":3472,"\u304c\u3089":600,"\u3053\u3046":-790,"\u3053\u3068":2083,"\u3053\u3093":-1262,"\u3055\u3089":-4143,"\u3055\u3093":4573,"\u3057\u305f":2641,"\u3057\u3066":1104,"\u3059\u3067":-3399,"\u305d\u3053":1977,"\u305d\u308c":-871,"\u305f\u3061":1122,"\u305f\u3081":601,"\u3063\u305f":3463,"\u3064\u3044":-802,"\u3066\u3044":805,"\u3066\u304d":1249,"\u3067\u304d":1127,"\u3067\u3059":3445,"\u3067\u306f":844,"\u3068\u3044":-4915,"\u3068\u307f":1922,"\u3069\u3053":3887,"\u306a\u3044":5713,"\u306a\u3063":3015,"\u306a\u3069":7379,"\u306a\u3093":-1113,"\u306b\u3057":2468,"\u306b\u306f":1498,"\u306b\u3082":1671,"\u306b\u5bfe":-912,"\u306e\u4e00":-501,"\u306e\u4e2d":741,"\u307e\u305b":2448,"\u307e\u3067":1711,"\u307e\u307e":2600,"\u307e\u308b":-2155,"\u3084\u3080":-1947,"\u3088\u3063":-2565,"\u308c\u305f":2369,"\u308c\u3067":-913,"\u3092\u3057":1860,"\u3092\u898b":731,"\u4ea1\u304f":-1886,"\u4eac\u90fd":2558,"\u53d6\u308a":-2784,"\u5927\u304d":-2604,"\u5927\u962a":1497,"\u5e73\u65b9":-2314,"\u5f15\u304d":-1336,"\u65e5\u672c":-195,"\u672c\u5f53":-2423,"\u6bce\u65e5":-2113,"\u76ee\u6307":-724,"\uff22\uff11\u3042":1404,"\uff22\uff11\u540c":542,"\uff63\u3068":1682};
        this.BW2__ = {"..":-11822,"11":-669,"\u2015\u2015":-5730,"\u2212\u2212":-13175,"\u3044\u3046":-1609,"\u3046\u304b":2490,"\u304b\u3057":-1350,"\u304b\u3082":-602,"\u304b\u3089":-7194,"\u304b\u308c":4612,"\u304c\u3044":853,"\u304c\u3089":-3198,"\u304d\u305f":1941,"\u304f\u306a":-1597,"\u3053\u3068":-8392,"\u3053\u306e":-4193,"\u3055\u305b":4533,"\u3055\u308c":13168,"\u3055\u3093":-3977,"\u3057\u3044":-1819,"\u3057\u304b":-545,"\u3057\u305f":5078,"\u3057\u3066":972,"\u3057\u306a":939,"\u305d\u306e":-3744,"\u305f\u3044":-1253,"\u305f\u305f":-662,"\u305f\u3060":-3857,"\u305f\u3061":-786,"\u305f\u3068":1224,"\u305f\u306f":-939,"\u3063\u305f":4589,"\u3063\u3066":1647,"\u3063\u3068":-2094,"\u3066\u3044":6144,"\u3066\u304d":3640,"\u3066\u304f":2551,"\u3066\u306f":-3110,"\u3066\u3082":-3065,"\u3067\u3044":2666,"\u3067\u304d":-1528,"\u3067\u3057":-3828,"\u3067\u3059":-4761,"\u3067\u3082":-4203,"\u3068\u3044":1890,"\u3068\u3053":-1746,"\u3068\u3068":-2279,"\u3068\u306e":720,"\u3068\u307f":5168,"\u3068\u3082":-3941,"\u306a\u3044":-2488,"\u306a\u304c":-1313,"\u306a\u3069":-6509,"\u306a\u306e":2614,"\u306a\u3093":3099,"\u306b\u304a":-1615,"\u306b\u3057":2748,"\u306b\u306a":2454,"\u306b\u3088":-7236,"\u306b\u5bfe":-14943,"\u306b\u5f93":-4688,"\u306b\u95a2":-11388,"\u306e\u304b":2093,"\u306e\u3067":-7059,"\u306e\u306b":-6041,"\u306e\u306e":-6125,"\u306f\u3044":1073,"\u306f\u304c":-1033,"\u306f\u305a":-2532,"\u3070\u308c":1813,"\u307e\u3057":-1316,"\u307e\u3067":-6621,"\u307e\u308c":5409,"\u3081\u3066":-3153,"\u3082\u3044":2230,"\u3082\u306e":-10713,"\u3089\u304b":-944,"\u3089\u3057":-1611,"\u3089\u306b":-1897,"\u308a\u3057":651,"\u308a\u307e":1620,"\u308c\u305f":4270,"\u308c\u3066":849,"\u308c\u3070":4114,"\u308d\u3046":6067,"\u308f\u308c":7901,"\u3092\u901a":-11877,"\u3093\u3060":728,"\u3093\u306a":-4115,"\u4e00\u4eba":602,"\u4e00\u65b9":-1375,"\u4e00\u65e5":970,"\u4e00\u90e8":-1051,"\u4e0a\u304c":-4479,"\u4f1a\u793e":-1116,"\u51fa\u3066":2163,"\u5206\u306e":-7758,"\u540c\u515a":970,"\u540c\u65e5":-913,"\u5927\u962a":-2471,"\u59d4\u54e1":-1250,"\u5c11\u306a":-1050,"\u5e74\u5ea6":-8669,"\u5e74\u9593":-1626,"\u5e9c\u770c":-2363,"\u624b\u6a29":-1982,"\u65b0\u805e":-4066,"\u65e5\u65b0":-722,"\u65e5\u672c":-7068,"\u65e5\u7c73":3372,"\u66dc\u65e5":-601,"\u671d\u9bae":-2355,"\u672c\u4eba":-2697,"\u6771\u4eac":-1543,"\u7136\u3068":-1384,"\u793e\u4f1a":-1276,"\u7acb\u3066":-990,"\u7b2c\u306b":-1612,"\u7c73\u56fd":-4268,"\uff11\uff11":-669};
        this.BW3__ = {"\u3042\u305f":-2194,"\u3042\u308a":719,"\u3042\u308b":3846,"\u3044.":-1185,"\u3044\u3002":-1185,"\u3044\u3044":5308,"\u3044\u3048":2079,"\u3044\u304f":3029,"\u3044\u305f":2056,"\u3044\u3063":1883,"\u3044\u308b":5600,"\u3044\u308f":1527,"\u3046\u3061":1117,"\u3046\u3068":4798,"\u3048\u3068":1454,"\u304b.":2857,"\u304b\u3002":2857,"\u304b\u3051":-743,"\u304b\u3063":-4098,"\u304b\u306b":-669,"\u304b\u3089":6520,"\u304b\u308a":-2670,"\u304c,":1816,"\u304c\u3001":1816,"\u304c\u304d":-4855,"\u304c\u3051":-1127,"\u304c\u3063":-913,"\u304c\u3089":-4977,"\u304c\u308a":-2064,"\u304d\u305f":1645,"\u3051\u3069":1374,"\u3053\u3068":7397,"\u3053\u306e":1542,"\u3053\u308d":-2757,"\u3055\u3044":-714,"\u3055\u3092":976,"\u3057,":1557,"\u3057\u3001":1557,"\u3057\u3044":-3714,"\u3057\u305f":3562,"\u3057\u3066":1449,"\u3057\u306a":2608,"\u3057\u307e":1200,"\u3059.":-1310,"\u3059\u3002":-1310,"\u3059\u308b":6521,"\u305a,":3426,"\u305a\u3001":3426,"\u305a\u306b":841,"\u305d\u3046":428,"\u305f.":8875,"\u305f\u3002":8875,"\u305f\u3044":-594,"\u305f\u306e":812,"\u305f\u308a":-1183,"\u305f\u308b":-853,"\u3060.":4098,"\u3060\u3002":4098,"\u3060\u3063":1004,"\u3063\u305f":-4748,"\u3063\u3066":300,"\u3066\u3044":6240,"\u3066\u304a":855,"\u3066\u3082":302,"\u3067\u3059":1437,"\u3067\u306b":-1482,"\u3067\u306f":2295,"\u3068\u3046":-1387,"\u3068\u3057":2266,"\u3068\u306e":541,"\u3068\u3082":-3543,"\u3069\u3046":4664,"\u306a\u3044":1796,"\u306a\u304f":-903,"\u306a\u3069":2135,"\u306b,":-1021,"\u306b\u3001":-1021,"\u306b\u3057":1771,"\u306b\u306a":1906,"\u306b\u306f":2644,"\u306e,":-724,"\u306e\u3001":-724,"\u306e\u5b50":-1000,"\u306f,":1337,"\u306f\u3001":1337,"\u3079\u304d":2181,"\u307e\u3057":1113,"\u307e\u3059":6943,"\u307e\u3063":-1549,"\u307e\u3067":6154,"\u307e\u308c":-793,"\u3089\u3057":1479,"\u3089\u308c":6820,"\u308b\u308b":3818,"\u308c,":854,"\u308c\u3001":854,"\u308c\u305f":1850,"\u308c\u3066":1375,"\u308c\u3070":-3246,"\u308c\u308b":1091,"\u308f\u308c":-605,"\u3093\u3060":606,"\u3093\u3067":798,"\u30ab\u6708":990,"\u4f1a\u8b70":860,"\u5165\u308a":1232,"\u5927\u4f1a":2217,"\u59cb\u3081":1681,"\u5e02":965,"\u65b0\u805e":-5055,"\u65e5,":974,"\u65e5\u3001":974,"\u793e\u4f1a":2024,"\uff76\u6708":990};
        this.TC1__ = {"AAA":1093,"HHH":1029,"HHM":580,"HII":998,"HOH":-390,"HOM":-331,"IHI":1169,"IOH":-142,"IOI":-1015,"IOM":467,"MMH":187,"OOI":-1832};
        this.TC2__ = {"HHO":2088,"HII":-1023,"HMM":-1154,"IHI":-1965,"KKH":703,"OII":-2649};
        this.TC3__ = {"AAA":-294,"HHH":346,"HHI":-341,"HII":-1088,"HIK":731,"HOH":-1486,"IHH":128,"IHI":-3041,"IHO":-1935,"IIH":-825,"IIM":-1035,"IOI":-542,"KHH":-1216,"KKA":491,"KKH":-1217,"KOK":-1009,"MHH":-2694,"MHM":-457,"MHO":123,"MMH":-471,"NNH":-1689,"NNO":662,"OHO":-3393};
        this.TC4__ = {"HHH":-203,"HHI":1344,"HHK":365,"HHM":-122,"HHN":182,"HHO":669,"HIH":804,"HII":679,"HOH":446,"IHH":695,"IHO":-2324,"IIH":321,"III":1497,"IIO":656,"IOO":54,"KAK":4845,"KKA":3386,"KKK":3065,"MHH":-405,"MHI":201,"MMH":-241,"MMM":661,"MOM":841};
        this.TQ1__ = {"BHHH":-227,"BHHI":316,"BHIH":-132,"BIHH":60,"BIII":1595,"BNHH":-744,"BOHH":225,"BOOO":-908,"OAKK":482,"OHHH":281,"OHIH":249,"OIHI":200,"OIIH":-68};
        this.TQ2__ = {"BIHH":-1401,"BIII":-1033,"BKAK":-543,"BOOO":-5591};
        this.TQ3__ = {"BHHH":478,"BHHM":-1073,"BHIH":222,"BHII":-504,"BIIH":-116,"BIII":-105,"BMHI":-863,"BMHM":-464,"BOMH":620,"OHHH":346,"OHHI":1729,"OHII":997,"OHMH":481,"OIHH":623,"OIIH":1344,"OKAK":2792,"OKHH":587,"OKKA":679,"OOHH":110,"OOII":-685};
        this.TQ4__ = {"BHHH":-721,"BHHM":-3604,"BHII":-966,"BIIH":-607,"BIII":-2181,"OAAA":-2763,"OAKK":180,"OHHH":-294,"OHHI":2446,"OHHO":480,"OHIH":-1573,"OIHH":1935,"OIHI":-493,"OIIH":626,"OIII":-4007,"OKAK":-8156};
        this.TW1__ = {"\u306b\u3064\u3044":-4681,"\u6771\u4eac\u90fd":2026};
        this.TW2__ = {"\u3042\u308b\u7a0b":-2049,"\u3044\u3063\u305f":-1256,"\u3053\u308d\u304c":-2434,"\u3057\u3087\u3046":3873,"\u305d\u306e\u5f8c":-4430,"\u3060\u3063\u3066":-1049,"\u3066\u3044\u305f":1833,"\u3068\u3057\u3066":-4657,"\u3068\u3082\u306b":-4517,"\u3082\u306e\u3067":1882,"\u4e00\u6c17\u306b":-792,"\u521d\u3081\u3066":-1512,"\u540c\u6642\u306b":-8097,"\u5927\u304d\u306a":-1255,"\u5bfe\u3057\u3066":-2721,"\u793e\u4f1a\u515a":-3216};
        this.TW3__ = {"\u3044\u305f\u3060":-1734,"\u3057\u3066\u3044":1314,"\u3068\u3057\u3066":-4314,"\u306b\u3064\u3044":-5483,"\u306b\u3068\u3063":-5989,"\u306b\u5f53\u305f":-6247,"\u306e\u3067,":-727,"\u306e\u3067\u3001":-727,"\u306e\u3082\u306e":-600,"\u308c\u304b\u3089":-3752,"\u5341\u4e8c\u6708":-2287};
        this.TW4__ = {"\u3044\u3046.":8576,"\u3044\u3046\u3002":8576,"\u304b\u3089\u306a":-2348,"\u3057\u3066\u3044":2958,"\u305f\u304c,":1516,"\u305f\u304c\u3001":1516,"\u3066\u3044\u308b":1538,"\u3068\u3044\u3046":1349,"\u307e\u3057\u305f":5543,"\u307e\u305b\u3093":1097,"\u3088\u3046\u3068":-4258,"\u3088\u308b\u3068":5865};
        this.UC1__ = {"A":484,"K":93,"M":645,"O":-505};
        this.UC2__ = {"A":819,"H":1059,"I":409,"M":3987,"N":5775,"O":646};
        this.UC3__ = {"A":-1370,"I":2311};
        this.UC4__ = {"A":-2643,"H":1809,"I":-1032,"K":-3450,"M":3565,"N":3876,"O":6646};
        this.UC5__ = {"H":313,"I":-1238,"K":-799,"M":539,"O":-831};
        this.UC6__ = {"H":-506,"I":-253,"K":87,"M":247,"O":-387};
        this.UP1__ = {"O":-214};
        this.UP2__ = {"B":69,"O":935};
        this.UP3__ = {"B":189};
        this.UQ1__ = {"BH":21,"BI":-12,"BK":-99,"BN":142,"BO":-56,"OH":-95,"OI":477,"OK":410,"OO":-2422};
        this.UQ2__ = {"BH":216,"BI":113,"OK":1759};
        this.UQ3__ = {"BA":-479,"BH":42,"BI":1913,"BK":-7198,"BM":3160,"BN":6427,"BO":14761,"OI":-827,"ON":-3212};
        this.UW1__ = {",":156,"\u3001":156,"\u300c":-463,"\u3042":-941,"\u3046":-127,"\u304c":-553,"\u304d":121,"\u3053":505,"\u3067":-201,"\u3068":-547,"\u3069":-123,"\u306b":-789,"\u306e":-185,"\u306f":-847,"\u3082":-466,"\u3084":-470,"\u3088":182,"\u3089":-292,"\u308a":208,"\u308c":169,"\u3092":-446,"\u3093":-137,"\u30fb":-135,"\u4e3b":-402,"\u4eac":-268,"\u533a":-912,"\u5348":871,"\u56fd":-460,"\u5927":561,"\u59d4":729,"\u5e02":-411,"\u65e5":-141,"\u7406":361,"\u751f":-408,"\u770c":-386,"\u90fd":-718,"\uff62":-463,"\uff65":-135};
        this.UW2__ = {",":-829,"\u3001":-829,"\u3007":892,"\u300c":-645,"\u300d":3145,"\u3042":-538,"\u3044":505,"\u3046":134,"\u304a":-502,"\u304b":1454,"\u304c":-856,"\u304f":-412,"\u3053":1141,"\u3055":878,"\u3056":540,"\u3057":1529,"\u3059":-675,"\u305b":300,"\u305d":-1011,"\u305f":188,"\u3060":1837,"\u3064":-949,"\u3066":-291,"\u3067":-268,"\u3068":-981,"\u3069":1273,"\u306a":1063,"\u306b":-1764,"\u306e":130,"\u306f":-409,"\u3072":-1273,"\u3079":1261,"\u307e":600,"\u3082":-1263,"\u3084":-402,"\u3088":1639,"\u308a":-579,"\u308b":-694,"\u308c":571,"\u3092":-2516,"\u3093":2095,"\u30a2":-587,"\u30ab":306,"\u30ad":568,"\u30c3":831,"\u4e09":-758,"\u4e0d":-2150,"\u4e16":-302,"\u4e2d":-968,"\u4e3b":-861,"\u4e8b":492,"\u4eba":-123,"\u4f1a":978,"\u4fdd":362,"\u5165":548,"\u521d":-3025,"\u526f":-1566,"\u5317":-3414,"\u533a":-422,"\u5927":-1769,"\u5929":-865,"\u592a":-483,"\u5b50":-1519,"\u5b66":760,"\u5b9f":1023,"\u5c0f":-2009,"\u5e02":-813,"\u5e74":-1060,"\u5f37":1067,"\u624b":-1519,"\u63fa":-1033,"\u653f":1522,"\u6587":-1355,"\u65b0":-1682,"\u65e5":-1815,"\u660e":-1462,"\u6700":-630,"\u671d":-1843,"\u672c":-1650,"\u6771":-931,"\u679c":-665,"\u6b21":-2378,"\u6c11":-180,"\u6c17":-1740,"\u7406":752,"\u767a":529,"\u76ee":-1584,"\u76f8":-242,"\u770c":-1165,"\u7acb":-763,"\u7b2c":810,"\u7c73":509,"\u81ea":-1353,"\u884c":838,"\u897f":-744,"\u898b":-3874,"\u8abf":1010,"\u8b70":1198,"\u8fbc":3041,"\u958b":1758,"\u9593":-1257,"\uff62":-645,"\uff63":3145,"\uff6f":831,"\uff71":-587,"\uff76":306,"\uff77":568};
        this.UW3__ = {",":4889,"1":-800,"\u2212":-1723,"\u3001":4889,"\u3005":-2311,"\u3007":5827,"\u300d":2670,"\u3013":-3573,"\u3042":-2696,"\u3044":1006,"\u3046":2342,"\u3048":1983,"\u304a":-4864,"\u304b":-1163,"\u304c":3271,"\u304f":1004,"\u3051":388,"\u3052":401,"\u3053":-3552,"\u3054":-3116,"\u3055":-1058,"\u3057":-395,"\u3059":584,"\u305b":3685,"\u305d":-5228,"\u305f":842,"\u3061":-521,"\u3063":-1444,"\u3064":-1081,"\u3066":6167,"\u3067":2318,"\u3068":1691,"\u3069":-899,"\u306a":-2788,"\u306b":2745,"\u306e":4056,"\u306f":4555,"\u3072":-2171,"\u3075":-1798,"\u3078":1199,"\u307b":-5516,"\u307e":-4384,"\u307f":-120,"\u3081":1205,"\u3082":2323,"\u3084":-788,"\u3088":-202,"\u3089":727,"\u308a":649,"\u308b":5905,"\u308c":2773,"\u308f":-1207,"\u3092":6620,"\u3093":-518,"\u30a2":551,"\u30b0":1319,"\u30b9":874,"\u30c3":-1350,"\u30c8":521,"\u30e0":1109,"\u30eb":1591,"\u30ed":2201,"\u30f3":278,"\u30fb":-3794,"\u4e00":-1619,"\u4e0b":-1759,"\u4e16":-2087,"\u4e21":3815,"\u4e2d":653,"\u4e3b":-758,"\u4e88":-1193,"\u4e8c":974,"\u4eba":2742,"\u4eca":792,"\u4ed6":1889,"\u4ee5":-1368,"\u4f4e":811,"\u4f55":4265,"\u4f5c":-361,"\u4fdd":-2439,"\u5143":4858,"\u515a":3593,"\u5168":1574,"\u516c":-3030,"\u516d":755,"\u5171":-1880,"\u5186":5807,"\u518d":3095,"\u5206":457,"\u521d":2475,"\u5225":1129,"\u524d":2286,"\u526f":4437,"\u529b":365,"\u52d5":-949,"\u52d9":-1872,"\u5316":1327,"\u5317":-1038,"\u533a":4646,"\u5343":-2309,"\u5348":-783,"\u5354":-1006,"\u53e3":483,"\u53f3":1233,"\u5404":3588,"\u5408":-241,"\u540c":3906,"\u548c":-837,"\u54e1":4513,"\u56fd":642,"\u578b":1389,"\u5834":1219,"\u5916":-241,"\u59bb":2016,"\u5b66":-1356,"\u5b89":-423,"\u5b9f":-1008,"\u5bb6":1078,"\u5c0f":-513,"\u5c11":-3102,"\u5dde":1155,"\u5e02":3197,"\u5e73":-1804,"\u5e74":2416,"\u5e83":-1030,"\u5e9c":1605,"\u5ea6":1452,"\u5efa":-2352,"\u5f53":-3885,"\u5f97":1905,"\u601d":-1291,"\u6027":1822,"\u6238":-488,"\u6307":-3973,"\u653f":-2013,"\u6559":-1479,"\u6570":3222,"\u6587":-1489,"\u65b0":1764,"\u65e5":2099,"\u65e7":5792,"\u6628":-661,"\u6642":-1248,"\u66dc":-951,"\u6700":-937,"\u6708":4125,"\u671f":360,"\u674e":3094,"\u6751":364,"\u6771":-805,"\u6838":5156,"\u68ee":2438,"\u696d":484,"\u6c0f":2613,"\u6c11":-1694,"\u6c7a":-1073,"\u6cd5":1868,"\u6d77":-495,"\u7121":979,"\u7269":461,"\u7279":-3850,"\u751f":-273,"\u7528":914,"\u753a":1215,"\u7684":7313,"\u76f4":-1835,"\u7701":792,"\u770c":6293,"\u77e5":-1528,"\u79c1":4231,"\u7a0e":401,"\u7acb":-960,"\u7b2c":1201,"\u7c73":7767,"\u7cfb":3066,"\u7d04":3663,"\u7d1a":1384,"\u7d71":-4229,"\u7dcf":1163,"\u7dda":1255,"\u8005":6457,"\u80fd":725,"\u81ea":-2869,"\u82f1":785,"\u898b":1044,"\u8abf":-562,"\u8ca1":-733,"\u8cbb":1777,"\u8eca":1835,"\u8ecd":1375,"\u8fbc":-1504,"\u901a":-1136,"\u9078":-681,"\u90ce":1026,"\u90e1":4404,"\u90e8":1200,"\u91d1":2163,"\u9577":421,"\u958b":-1432,"\u9593":1302,"\u95a2":-1282,"\u96e8":2009,"\u96fb":-1045,"\u975e":2066,"\u99c5":1620,"\uff11":-800,"\uff63":2670,"\uff65":-3794,"\uff6f":-1350,"\uff71":551,"\uff78\uff9e":1319,"\uff7d":874,"\uff84":521,"\uff91":1109,"\uff99":1591,"\uff9b":2201,"\uff9d":278};
        this.UW4__ = {",":3930,".":3508,"\u2015":-4841,"\u3001":3930,"\u3002":3508,"\u3007":4999,"\u300c":1895,"\u300d":3798,"\u3013":-5156,"\u3042":4752,"\u3044":-3435,"\u3046":-640,"\u3048":-2514,"\u304a":2405,"\u304b":530,"\u304c":6006,"\u304d":-4482,"\u304e":-3821,"\u304f":-3788,"\u3051":-4376,"\u3052":-4734,"\u3053":2255,"\u3054":1979,"\u3055":2864,"\u3057":-843,"\u3058":-2506,"\u3059":-731,"\u305a":1251,"\u305b":181,"\u305d":4091,"\u305f":5034,"\u3060":5408,"\u3061":-3654,"\u3063":-5882,"\u3064":-1659,"\u3066":3994,"\u3067":7410,"\u3068":4547,"\u306a":5433,"\u306b":6499,"\u306c":1853,"\u306d":1413,"\u306e":7396,"\u306f":8578,"\u3070":1940,"\u3072":4249,"\u3073":-4134,"\u3075":1345,"\u3078":6665,"\u3079":-744,"\u307b":1464,"\u307e":1051,"\u307f":-2082,"\u3080":-882,"\u3081":-5046,"\u3082":4169,"\u3083":-2666,"\u3084":2795,"\u3087":-1544,"\u3088":3351,"\u3089":-2922,"\u308a":-9726,"\u308b":-14896,"\u308c":-2613,"\u308d":-4570,"\u308f":-1783,"\u3092":13150,"\u3093":-2352,"\u30ab":2145,"\u30b3":1789,"\u30bb":1287,"\u30c3":-724,"\u30c8":-403,"\u30e1":-1635,"\u30e9":-881,"\u30ea":-541,"\u30eb":-856,"\u30f3":-3637,"\u30fb":-4371,"\u30fc":-11870,"\u4e00":-2069,"\u4e2d":2210,"\u4e88":782,"\u4e8b":-190,"\u4e95":-1768,"\u4eba":1036,"\u4ee5":544,"\u4f1a":950,"\u4f53":-1286,"\u4f5c":530,"\u5074":4292,"\u5148":601,"\u515a":-2006,"\u5171":-1212,"\u5185":584,"\u5186":788,"\u521d":1347,"\u524d":1623,"\u526f":3879,"\u529b":-302,"\u52d5":-740,"\u52d9":-2715,"\u5316":776,"\u533a":4517,"\u5354":1013,"\u53c2":1555,"\u5408":-1834,"\u548c":-681,"\u54e1":-910,"\u5668":-851,"\u56de":1500,"\u56fd":-619,"\u5712":-1200,"\u5730":866,"\u5834":-1410,"\u5841":-2094,"\u58eb":-1413,"\u591a":1067,"\u5927":571,"\u5b50":-4802,"\u5b66":-1397,"\u5b9a":-1057,"\u5bfa":-809,"\u5c0f":1910,"\u5c4b":-1328,"\u5c71":-1500,"\u5cf6":-2056,"\u5ddd":-2667,"\u5e02":2771,"\u5e74":374,"\u5e81":-4556,"\u5f8c":456,"\u6027":553,"\u611f":916,"\u6240":-1566,"\u652f":856,"\u6539":787,"\u653f":2182,"\u6559":704,"\u6587":522,"\u65b9":-856,"\u65e5":1798,"\u6642":1829,"\u6700":845,"\u6708":-9066,"\u6728":-485,"\u6765":-442,"\u6821":-360,"\u696d":-1043,"\u6c0f":5388,"\u6c11":-2716,"\u6c17":-910,"\u6ca2":-939,"\u6e08":-543,"\u7269":-735,"\u7387":672,"\u7403":-1267,"\u751f":-1286,"\u7523":-1101,"\u7530":-2900,"\u753a":1826,"\u7684":2586,"\u76ee":922,"\u7701":-3485,"\u770c":2997,"\u7a7a":-867,"\u7acb":-2112,"\u7b2c":788,"\u7c73":2937,"\u7cfb":786,"\u7d04":2171,"\u7d4c":1146,"\u7d71":-1169,"\u7dcf":940,"\u7dda":-994,"\u7f72":749,"\u8005":2145,"\u80fd":-730,"\u822c":-852,"\u884c":-792,"\u898f":792,"\u8b66":-1184,"\u8b70":-244,"\u8c37":-1000,"\u8cde":730,"\u8eca":-1481,"\u8ecd":1158,"\u8f2a":-1433,"\u8fbc":-3370,"\u8fd1":929,"\u9053":-1291,"\u9078":2596,"\u90ce":-4866,"\u90fd":1192,"\u91ce":-1100,"\u9280":-2213,"\u9577":357,"\u9593":-2344,"\u9662":-2297,"\u969b":-2604,"\u96fb":-878,"\u9818":-1659,"\u984c":-792,"\u9928":-1984,"\u9996":1749,"\u9ad8":2120,"\uff62":1895,"\uff63":3798,"\uff65":-4371,"\uff6f":-724,"\uff70":-11870,"\uff76":2145,"\uff7a":1789,"\uff7e":1287,"\uff84":-403,"\uff92":-1635,"\uff97":-881,"\uff98":-541,"\uff99":-856,"\uff9d":-3637};
        this.UW5__ = {",":465,".":-299,"1":-514,"E2":-32768,"]":-2762,"\u3001":465,"\u3002":-299,"\u300c":363,"\u3042":1655,"\u3044":331,"\u3046":-503,"\u3048":1199,"\u304a":527,"\u304b":647,"\u304c":-421,"\u304d":1624,"\u304e":1971,"\u304f":312,"\u3052":-983,"\u3055":-1537,"\u3057":-1371,"\u3059":-852,"\u3060":-1186,"\u3061":1093,"\u3063":52,"\u3064":921,"\u3066":-18,"\u3067":-850,"\u3068":-127,"\u3069":1682,"\u306a":-787,"\u306b":-1224,"\u306e":-635,"\u306f":-578,"\u3079":1001,"\u307f":502,"\u3081":865,"\u3083":3350,"\u3087":854,"\u308a":-208,"\u308b":429,"\u308c":504,"\u308f":419,"\u3092":-1264,"\u3093":327,"\u30a4":241,"\u30eb":451,"\u30f3":-343,"\u4e2d":-871,"\u4eac":722,"\u4f1a":-1153,"\u515a":-654,"\u52d9":3519,"\u533a":-901,"\u544a":848,"\u54e1":2104,"\u5927":-1296,"\u5b66":-548,"\u5b9a":1785,"\u5d50":-1304,"\u5e02":-2991,"\u5e2d":921,"\u5e74":1763,"\u601d":872,"\u6240":-814,"\u6319":1618,"\u65b0":-1682,"\u65e5":218,"\u6708":-4353,"\u67fb":932,"\u683c":1356,"\u6a5f":-1508,"\u6c0f":-1347,"\u7530":240,"\u753a":-3912,"\u7684":-3149,"\u76f8":1319,"\u7701":-1052,"\u770c":-4003,"\u7814":-997,"\u793e":-278,"\u7a7a":-813,"\u7d71":1955,"\u8005":-2233,"\u8868":663,"\u8a9e":-1073,"\u8b70":1219,"\u9078":-1018,"\u90ce":-368,"\u9577":786,"\u9593":1191,"\u984c":2368,"\u9928":-689,"\uff11":-514,"\uff25\uff12":-32768,"\uff62":363,"\uff72":241,"\uff99":451,"\uff9d":-343};
        this.UW6__ = {",":227,".":808,"1":-270,"E1":306,"\u3001":227,"\u3002":808,"\u3042":-307,"\u3046":189,"\u304b":241,"\u304c":-73,"\u304f":-121,"\u3053":-200,"\u3058":1782,"\u3059":383,"\u305f":-428,"\u3063":573,"\u3066":-1014,"\u3067":101,"\u3068":-105,"\u306a":-253,"\u306b":-149,"\u306e":-417,"\u306f":-236,"\u3082":-206,"\u308a":187,"\u308b":-135,"\u3092":195,"\u30eb":-673,"\u30f3":-496,"\u4e00":-277,"\u4e2d":201,"\u4ef6":-800,"\u4f1a":624,"\u524d":302,"\u533a":1792,"\u54e1":-1212,"\u59d4":798,"\u5b66":-960,"\u5e02":887,"\u5e83":-695,"\u5f8c":535,"\u696d":-697,"\u76f8":753,"\u793e":-507,"\u798f":974,"\u7a7a":-822,"\u8005":1811,"\u9023":463,"\u90ce":1082,"\uff11":-270,"\uff25\uff11":306,"\uff99":-673,"\uff9d":-496};

        return this;
    }

    TinySegmenter.prototype.ctype_ = function(str) {
        for (var i in this.chartype_) {
            if (str.match(this.chartype_[i][0])) {
                return this.chartype_[i][1];
            }
        }
        return "O";
    }

    TinySegmenter.prototype.ts_ = function(v) {
        if (v) { return v; }
        return 0;
    }

    TinySegmenter.prototype.segment = function(input) {
        if (input === null || input === undefined || input === "") {
            return [];
        }
    
        var unicode_spaces = [ '\u0020', '\u00A0', '\u1680', '\u180E', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u200B', '\u202F', '\u205F', '\u3000', '\uFFFF' ];
    
        var result = [];
        var seg = ["B3","B2","B1"];
        var ctype = ["O","O","O"];
        var o = input.split("");
        for (var i = 0; i < o.length; ++i) {
            seg.push(o[i]);
            ctype.push(this.ctype_(o[i]));
        }
        seg.push("E1");
        seg.push("E2");
        seg.push("E3");
        ctype.push("O");
        ctype.push("O");
        ctype.push("O");
        var word = seg[3];
        var p1 = "U";
        var p2 = "U";
        var p3 = "U";
        for (var i = 4; i < seg.length - 3; ++i) {
            var score = this.BIAS__;
            var w1 = seg[i-3];
            var w2 = seg[i-2];
            var w3 = seg[i-1];
            var w4 = seg[i];
            var w5 = seg[i+1];
            var w6 = seg[i+2];
            var c1 = ctype[i-3];
            var c2 = ctype[i-2];
            var c3 = ctype[i-1];
            var c4 = ctype[i];
            var c5 = ctype[i+1];
            var c6 = ctype[i+2];
            score += this.ts_(this.UP1__[p1]);
            score += this.ts_(this.UP2__[p2]);
            score += this.ts_(this.UP3__[p3]);
            score += this.ts_(this.BP1__[p1 + p2]);
            score += this.ts_(this.BP2__[p2 + p3]);
            score += this.ts_(this.UW1__[w1]);
            score += this.ts_(this.UW2__[w2]);
            score += this.ts_(this.UW3__[w3]);
            score += this.ts_(this.UW4__[w4]);
            score += this.ts_(this.UW5__[w5]);
            score += this.ts_(this.UW6__[w6]);
            score += this.ts_(this.BW1__[w2 + w3]);
            score += this.ts_(this.BW2__[w3 + w4]);
            score += this.ts_(this.BW3__[w4 + w5]);
            score += this.ts_(this.TW1__[w1 + w2 + w3]);
            score += this.ts_(this.TW2__[w2 + w3 + w4]);
            score += this.ts_(this.TW3__[w3 + w4 + w5]);
            score += this.ts_(this.TW4__[w4 + w5 + w6]);
            score += this.ts_(this.UC1__[c1]);
            score += this.ts_(this.UC2__[c2]);
            score += this.ts_(this.UC3__[c3]);
            score += this.ts_(this.UC4__[c4]);
            score += this.ts_(this.UC5__[c5]);
            score += this.ts_(this.UC6__[c6]);
            score += this.ts_(this.BC1__[c2 + c3]);
            score += this.ts_(this.BC2__[c3 + c4]);
            score += this.ts_(this.BC3__[c4 + c5]);
            score += this.ts_(this.TC1__[c1 + c2 + c3]);
            score += this.ts_(this.TC2__[c2 + c3 + c4]);
            score += this.ts_(this.TC3__[c3 + c4 + c5]);
            score += this.ts_(this.TC4__[c4 + c5 + c6]);
            //  score += this.ts_(this.TC5__[c4 + c5 + c6]);    
            score += this.ts_(this.UQ1__[p1 + c1]);
            score += this.ts_(this.UQ2__[p2 + c2]);
            score += this.ts_(this.UQ3__[p3 + c3]);
            score += this.ts_(this.BQ1__[p2 + c2 + c3]);
            score += this.ts_(this.BQ2__[p2 + c3 + c4]);
            score += this.ts_(this.BQ3__[p3 + c2 + c3]);
            score += this.ts_(this.BQ4__[p3 + c3 + c4]);
            score += this.ts_(this.TQ1__[p2 + c1 + c2 + c3]);
            score += this.ts_(this.TQ2__[p2 + c2 + c3 + c4]);
            score += this.ts_(this.TQ3__[p3 + c1 + c2 + c3]);
            score += this.ts_(this.TQ4__[p3 + c2 + c3 + c4]);
            var p = "O";
            if (score > 0) {
                result.push(word);
                word = "";
                p = "B";
            }
            p1 = p2;
            p2 = p3;
            p3 = p;
            word += seg[i];
        }
        result.push(word);
        result = result.filter(function(w){ return unicode_spaces.indexOf(w) === -1 });
        return result;
    }
})(jQuery);
