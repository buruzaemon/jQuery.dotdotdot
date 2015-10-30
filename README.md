jQuery.dotdotdot
================

[jQuery.dotdotdot](https://github.com/BeSite/jQuery.dotdotdot) is a jQuery plugin for advanced cross-browser ellipsis on multiple line content.
This fork uses the [TinySegmenter.js](http://chasen.org/~taku/software/TinySegmenter/) to intelligently do text ellipsis even for Japanese text.


### Usage
Include all necessary .js-files inside the head-tag of the page.

```html
<head>
    <script src="jquery.js" type="text/javascript"></script>
    <script src="jquery.dotdotdot.js" type="text/javascript"></script>
</head>
```

Create a DOM element and put some text and other HTML markup in this "wrapper".

```html
<div id="wrapper">
    <p>Lorem Ipsum is simply dummy text.</p>
</div>
```

Fire the plugin onDocumentReady using the wrapper-selector.

```javascript
$(document).ready(function() {
    $("#wrapper").dotdotdot({
        // configuration goes here
    });
});
```

The following character encodings related for Japanese text are supported:
- UTF-8
- EUC-JP
- SHIFT_JIS
- ISO-2022-JP


### More info
Please visit http://dotdotdot.frebsite.nl

### Licences
- The jQuery.dotdotdot plugin is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
- Tiny Segmenter is licensed under the new [BSD
  license](https://en.wikipedia.org/wiki/BSD_licenses#2-clause_license_.28.22Simplified_BSD_License.22_or_.22FreeBSD_License.22.29)
- This fork of the jQuery.dotdotdot plugin is also licensed under the
  Simplified BSD License.
