// Glue between BiwaScheme and LiaScript code blocks.
//
// Every run of a code block gets its own Session with its own output port,
// input port and error handler, so output always lands in the console of the
// block that produced it, even after (sleep …), (timer …) or an event handler.

import './jquery-global.js'
import BiwaScheme from 'biwascheme'

const { Interpreter, Port, undef, to_write, to_display, define_libfunc } = BiwaScheme

// The session whose code runs right now (see activate).
let current = null

class Session {
  constructor(console, terminal) {
    this.console = console
    this.terminal = terminal
    this.running = false
    this.stopped = false
    this.reader = null // pending (read-line) callback
    this.onFinish = null
    this.newline = false // a printed newline that is held back

    this.output = new Port.CustomOutput((str) => this.write(str))
    this.input = new Port.CustomInput((callback) => {
      if (!this.terminal) {
        throw new Error('read-line: needs a terminal, use @BiwaScheme.evalWithTerminal')
      }
      this.reader = callback
    })

    // Interpreters that BiwaScheme creates for timers and event handlers copy
    // the error handler of their parent, so the handler carries the session.
    const onError = (e) => this.error(e)
    onError.session = this
    this.interpreter = new Interpreter(onError)
  }

  // Printed text. A trailing newline is held back: before more text it is
  // printed, before a line of its own (a value, HTML, an error) it is dropped,
  // because that line starts on a new line anyway.
  write(str) {
    if (this.newline) str = '\n' + str
    this.newline = str.endsWith('\n')
    if (this.newline) str = str.slice(0, -1)
    if (str) this.console.stream(str)
  }

  // A line of its own: 'debug' for values, 'html' for HTML, 'error'.
  line(kind, text) {
    this.newline = false
    this.console[kind](text)
  }

  activate() {
    current = this
    Port.current_output = this.output
    Port.current_error = this.output
    Port.current_input = this.input
  }

  evaluate(code) {
    this.running = true
    this.interpreter.evaluate(code, (result) => this.done(result))
  }

  read(line) {
    const reader = this.reader
    this.reader = null
    reader(line)
  }

  done(result) {
    this.value(result)
    this.finish()
  }

  // Shows a value as a Scheme prompt does; unspecified values stay silent.
  value(v) {
    if (v !== undef && v !== undefined) this.line('debug', to_write(v))
  }

  error(e) {
    this.line('error', e && e.message ? e.message : String(e))
    this.reader = null
    this.finish()
  }

  stop() {
    this.stopped = true
    this.reader = null
    this.finish()
  }

  finish() {
    const wasRunning = this.running
    this.running = false
    if (wasRunning && this.onFinish) this.onFinish()
  }
}

// All entry points into the interpreter switch to the session of the
// interpreter first. Errors are caught at the outermost call only: errors in
// a nested call (a comparator for sort, …) belong to the surrounding program.
let depth = 0

for (const name of ['resume', 'invoke_closure']) {
  const original = Interpreter.prototype[name]

  Interpreter.prototype[name] = function (...args) {
    const session = this.on_error && this.on_error.session
    if (!session) return original.apply(this, args)
    if (session.stopped) return undef

    session.activate()
    depth++
    try {
      return original.apply(this, args)
    } catch (e) {
      if (depth > 1) throw e
      if (e instanceof Error && this.call_stack && this.call_stack.length) {
        e.message += ' [' + this.call_stack.join(', ') + ']'
      }
      return this.on_error(e)
    } finally {
      depth--
    }
  }
}

// Splits a program into its top-level forms (a datum with its quote prefixes).
function topLevelForms(code) {
  const forms = []
  const n = code.length
  let i = 0
  const ws = (k) => code.charCodeAt(k) <= 32
  const eol = () => { while (i < n && code[i] !== '\n') i++ }

  while (i < n) {
    if (ws(i)) { i++; continue }
    if (code[i] === ';') { eol(); continue }
    const start = i
    while ("'`,@".includes(code[i]) && i < n) i++
    if (code[i] === '(') {
      let depth = 0
      while (i < n) {
        const c = code[i]
        if (c === '"') { i++; while (i < n && code[i] !== '"') i += code[i] === '\\' ? 2 : 1 }
        else if (c === ';') { eol(); continue }
        else if (c === '#' && code[i + 1] === '\\') i += 2
        else if (c === '(') depth++
        else if (c === ')') { depth--; if (depth === 0) { i++; break } }
        i++
      }
    } else {
      if (code[i] === '#' && code[i + 1] === '\\') i += 3
      while (i < n && !ws(i) && code[i] !== '(' && code[i] !== ')') i++
    }
    if (i === start) i++
    forms.push(code.slice(start, i))
  }
  return forms
}

// The name a top-level (define …) defines, or null for other forms
// (define-macro, define-record-type, …).
function definedName(form) {
  const m = form.match(/^\(define[\s(]+([^\s()]+)/)
  return m && /^\(define[\s(]/.test(form) ? m[1] : null
}

// Shows the value of every top-level expression, as a Scheme prompt does, and
// answers a definition with ";Value: name", as MIT Scheme does. Unspecified
// values stay silent. The last value is shown by Session.done. With quiet set,
// definitions are not answered (for long blocks of definitions).
function showEveryValue(code, quiet) {
  const forms = topLevelForms(code)
  return forms.map((f, k) => {
    const name = definedName(f)
    if (name && quiet) return f
    if (name) return f + '\n(%lia-note ' + JSON.stringify(';Value: ' + name) + ')'
    if (k === forms.length - 1 || f.startsWith('(define')) return f
    return '(%lia-value ' + f + ')'
  }).join('\n')
}

// Scheme procedures that write into the terminal of the running code block.
define_libfunc('%lia-value', 1, 1, (ar) => { if (current) current.value(ar[0]); return undef })
define_libfunc('%lia-note', 1, 1, (ar) => { if (current) current.line('debug', to_display(ar[0])); return undef })
define_libfunc('display-html', 1, 1, (ar) => { if (current) current.line('html', to_display(ar[0])); return undef })

window.BiwaLia = {
  // Runs a program once. The program starts after the script has returned
  // "LIA: wait", because LiaScript clears the console at that moment.
  // With quiet set, definitions are not answered with ";Value: name".
  eval(code, console, send, quiet) {
    const session = new Session(console, false)
    session.onFinish = () => send.lia('LIA: stop')

    setTimeout(() => session.evaluate(showEveryValue(code, quiet)), 0)
    return 'LIA: wait'
  },

  // Runs a program and keeps a terminal open: each line is evaluated in the
  // same environment, or answers a pending (read-line).
  terminal(code, console, send) {
    const session = new Session(console, true)

    send.handle('input', (line) => {
      line = line.replace(/\r?\n$/, '')
      if (session.reader) {
        session.read(line)
      } else if (session.running) {
        console.warn('still running, input ignored')
      } else {
        session.evaluate(showEveryValue(line))
      }
    })
    send.handle('stop', () => {
      session.stop()
      console.log('execution stopped')
    })

    // let the terminal open before the first output arrives
    setTimeout(() => session.evaluate(showEveryValue(code)), 0)
    return 'LIA: terminal'
  },
}
