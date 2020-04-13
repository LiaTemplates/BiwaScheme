<!--
author:   André Dietrich
email:    LiaScript@web.de
version:  0.0.1
language: en
narrator: UK English Male
logo:     https://raw.githubusercontent.com/biwascheme/biwascheme/master/website/images/biwascheme_logo.png

comment:  Template for integrating the
  [BiwaScheme](https://www.biwascheme.org) interpreter, which runs on
  JavaScript, into LiaScript courses.

attribute: [BiwaScheme](https://github.com/biwascheme/biwascheme) is released by
  Yutaka HARA (yhara) yutaka.hara.gmail.com http://twitter.com/yhara_en

script:   https://www.biwascheme.org/release/biwascheme-0.7.0-min.js


@BiwaScheme.eval
<script>
window.console = console

Console.puts = function(str, x){ console.debug(str) }

var biwa = new BiwaScheme.Interpreter(console.error)
biwa.evaluate(`@input`, function(result) {
  if (result != "#<undef>") {
    console.debug(result)
  }
});
"LIA: stop"
</script>
@end


@BiwaScheme.evalWithTerminal
<script>
window.console = console

Console.puts = function(str, x){ console.debug(str) }

var biwa = new BiwaScheme.Interpreter(console.error)

setTimeout(function() {
  biwa.evaluate(`@input`, function(result) {
    if (result != "#<undef>") {
      console.debug(result)
    }
  });
}, 100)

send.handle("input", input => {
  try{
    biwa.evaluate(input, function(result) {
      if (result != "#<undef>") {
        console.debug(result)
      }
    })
  } catch (e) {
    console.error(e);
  }
})

send.handle("stop", e => { console.log("execution stopped") })

"LIA: terminal"
</script>

@end
-->

# BiwaScheme - Template


                         --{{0}}--
This document defines some basic macros for applying the JavaScript
[BiwaScheme](https://www.biwascheme.org) interpreter in
[LiaScript](https://LiaScript.github.io) to make Scheme code snippets in
Markdown executeable and editable.

__Try it on LiaScript:__

https://liascript.github.io/course/?https://github.com/liaTemplates/BiwaScheme

__See the project on Github:__

https://github.com/liaTemplates/BiwaScheme

                         --{{1}}--
There are three ways to use this template. The easiest way is to use the
`import` statement and the url of the raw text-file of the master branch or any
other branch or version. But you can also copy the required functionionality
directly into the header of your Markdown document, see therefor the
[last slide](#Implementation). And of course, you could also clone this project
and change it, as you wish.

  {{1}}
1. Load the macros via

   `import: https://github.com/liaTemplates/BiwaScheme/README.md`

2. Copy the definitions into your Project

3. Clone this repository on GitHub


## `@BiwaScheme.eval`

                         --{{0}}--
To use the [BiwaScheme](https://www.biwascheme.org) interpreter, simply add the
macros `@BiwaScheme.eval` to the end of your scheme snippet.

``` scheme
(print (+ 33 34 45))
```
@BiwaScheme.eval

                         --{{1}}--
For a complete overview on all available functions, see the BiwaScheme project
website:

                           {{1}}
https://www.biwascheme.org/doc/reference.html


## `@BiwaScheme.evalWithTerminal`

                         --{{0}}--
Use the `@BiwaScheme.evalWithTerminal` macro, if you want to enable interactive
programming. This opens a terminal after the programm execution that allows to
execute scheme code.

``` scheme
(print (+ 33 34 45))
```
@BiwaScheme.evalWithTerminal

## Implementation

                         --{{0}}--
The code shows how the macros were implemented by using a minified version of
the BiwaScheme JavaScript interpreter.

``` html
script:   https://www.biwascheme.org/release/biwascheme-0.7.0-min.js

@BiwaScheme.eval
<script>
window.console = console

Console.puts = function(str, x){ console.debug(str) }

var biwa = new BiwaScheme.Interpreter(console.error)
biwa.evaluate(`@input`, function(result) {
  if (result != "#<undef>") {
    console.debug(result)
  }
});
"LIA: stop"
</script>
@end


@BiwaScheme.evalWithTerminal
<script>
window.console = console

Console.puts = function(str, x){ console.debug(str) }

var biwa = new BiwaScheme.Interpreter(console.error)

setTimeout(function() {
  biwa.evaluate(`@input`, function(result) {
    if (result != "#<undef>") {
      console.debug(result)
    }
  });
}, 100)

send.handle("input", input => {
  try{
    biwa.evaluate(input, function(result) {
      if (result != "#<undef>") {
        console.debug(result)
      }
    })
  } catch (e) {
    console.error(e);
  }
})

send.handle("stop", e => { console.log("execution stopped") })

"LIA: terminal"
</script>

@end
```


                         --{{1}}--
If you want to minimize loading effort in your LiaScript project, you can also
copy this code and paste it into your main comment header, see the code in the
raw file of this document.

{{1}} https://raw.githubusercontent.com/liaTemplates/BiwaScheme/master/README.md
