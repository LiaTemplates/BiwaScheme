<!--
author:   André Dietrich
email:    LiaScript@web.de
version:  0.1.0
language: en
narrator: UK English Male
logo:     https://raw.githubusercontent.com/biwascheme/biwascheme/master/website/images/biwascheme_logo.png

comment:  Run and edit Scheme code in LiaScript courses with the BiwaScheme
          interpreter: one-shot runs, an interactive terminal with
          read-line, and asynchronous code with sleep and timers.

attribute: [BiwaScheme](https://www.biwascheme.org) by Yutaka HARA is licensed
           under [MIT](https://github.com/biwascheme/biwascheme/blob/master/MIT-LICENSE.txt)

attribute: [jQuery](https://jquery.com) by the OpenJS Foundation is licensed
           under [MIT](https://jquery.org/license)

script:   dist/index.js

@BiwaScheme.eval: <script>BiwaLia.eval(`@'input`, console, send)</script>

@BiwaScheme.evalWithTerminal: <script>BiwaLia.terminal(`@'input`, console, send)</script>
-->

# BiwaScheme - Template

                         --{{0}}--
This template uses the [BiwaScheme](https://www.biwascheme.org) interpreter to
make Scheme code in [LiaScript](https://LiaScript.github.io) courses editable
and executable. BiwaScheme implements most of R7RS Scheme and runs entirely in
the browser.

__Try it on LiaScript:__

https://liascript.github.io/course/?https://raw.githubusercontent.com/LiaTemplates/BiwaScheme/master/README.md

__See the project on GitHub:__

https://github.com/LiaTemplates/BiwaScheme

                         --{{1}}--
To use the macros, import this template in the header of your course. The
pinned version never changes, so your course keeps working. The master version
always contains the latest fixes and features.

                           {{1}}
************************************************************

__Pinned version (recommended):__

`import: https://raw.githubusercontent.com/LiaTemplates/BiwaScheme/0.1.0/README.md`

__Latest version:__

`import: https://raw.githubusercontent.com/LiaTemplates/BiwaScheme/master/README.md`

************************************************************


## `@BiwaScheme.eval`

                         --{{0}}--
Add the macro `@BiwaScheme.eval` directly below a Scheme code block. The block
becomes editable and gets a run button. Everything the program prints appears
in the console below, followed by the value of the last expression.

``` scheme
(define (fizzbuzz x y)
  (print
    (cond ((= (mod x 15) 0) "FizzBuzz")
          ((= (mod x 3) 0)  "Fizz")
          ((= (mod x 5) 0)  "Buzz")
          (else x)))

  (if (< x y) (fizzbuzz (+ x 1) y)))

(fizzbuzz 1 15)

(map (lambda (x) (* x x)) '(1 2 3 4 5))
```
@BiwaScheme.eval

                         --{{1}}--
All code blocks of a course share one environment. A function defined in one
block can be used in every block that runs after it, so a longer example can be
split into small steps. Run the block above first, then this one.

                           {{1}}
``` scheme
(fizzbuzz 40 45)
```
@BiwaScheme.eval

                         --{{2}}--
For a complete overview of all available functions, see the reference on the
BiwaScheme website.

                           {{2}}
https://www.biwascheme.org/doc/reference.html


## Errors and asynchronous code

                         --{{0}}--
Errors are shown in the console, together with the functions that were active
when the error happened. Try to fix the program below.

``` scheme
(define (average lst)
  (/ (apply + lst) (lenght lst)))

(average '(1 2 3 4))
```
@BiwaScheme.eval

                         --{{1}}--
Programs can also wait. The run continues in the background, so the course
stays usable, and the console shows each line as soon as it is printed.

                           {{1}}
``` scheme
(define (countdown n)
  (if (> n 0)
      (begin
        (print n)
        (sleep 1)
        (countdown (- n 1)))
      (print "Liftoff!")))

(countdown 5)
```
@BiwaScheme.eval


## `@BiwaScheme.evalWithTerminal`

                         --{{0}}--
Use `@BiwaScheme.evalWithTerminal` for interactive programming. After the
program has run, a terminal stays open, and every line typed into it is
evaluated in the same environment. Try `(fizzbuzz 1 30)` or define a new
function.

``` scheme
(define (fizzbuzz x y)
  (print
    (cond ((= (mod x 15) 0) "FizzBuzz")
          ((= (mod x 3) 0)  "Fizz")
          ((= (mod x 5) 0)  "Buzz")
          (else x)))

  (if (< x y) (fizzbuzz (+ x 1) y)))

(display "Try: (fizzbuzz 1 30)")
(newline)
```
@BiwaScheme.evalWithTerminal

                         --{{1}}--
The terminal also answers `read-line`, so programs can ask the learner for
input. Run the program and type your name into the terminal.

                           {{1}}
``` scheme
(display "What is your name? ")
(define name (read-line))

(display (string-append "Hello, " name "!"))
(newline)
```
@BiwaScheme.evalWithTerminal


## Implementation

                         --{{0}}--
The macros only pass the code block to a small JavaScript library. It is
bundled together with BiwaScheme and jQuery, which BiwaScheme needs for its DOM
functions, into the file `dist/index.js`.

``` html
script:   dist/index.js

@BiwaScheme.eval: <script>BiwaLia.eval(`@'input`, console, send)</script>

@BiwaScheme.evalWithTerminal: <script>BiwaLia.terminal(`@'input`, console, send)</script>
```

                         --{{1}}--
The source of this library is in `src/index.js`. Every run gets its own output
and input, so output always appears below the code block that produced it, also
after `sleep`, timers or event handlers. To change the library or to update
BiwaScheme, edit `package.json` or `src/index.js` and rebuild the bundle.

                           {{1}}
``` bash
npm install
npm run build   # src/index.js  →  dist/index.js
```

                         --{{2}}--
Commit the rebuilt `dist/index.js` too, because LiaScript loads it directly
from the repository.

                           {{2}}
https://github.com/LiaTemplates/BiwaScheme/blob/master/src/index.js
