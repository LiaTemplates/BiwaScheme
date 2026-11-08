// Glue between BiwaScheme and LiaScript code blocks.
//
// Every run of a code block gets its own Session with its own output port,
// input port and error handler, so output always lands in the console of the
// block that produced it, even after (sleep …), (timer …) or an event handler.

import './jquery-global.js'
import BiwaScheme from 'biwascheme'

const { Interpreter, Port, undef, to_write } = BiwaScheme

class Session {
  constructor(console, terminal) {
    this.console = console
    this.terminal = terminal
    this.running = false
    this.stopped = false
    this.reader = null // pending (read-line) callback
    this.onFinish = null

    this.output = new Port.CustomOutput((str) => console.stream(str))
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

  activate() {
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
    if (result !== undef && result !== undefined) {
      this.console.debug(to_write(result))
    }
    this.finish()
  }

  error(e) {
    this.console.error(e && e.message ? e.message : String(e))
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

window.BiwaLia = {
  // Runs a program once. The program starts after the script has returned
  // "LIA: wait", because LiaScript clears the console at that moment.
  eval(code, console, send) {
    const session = new Session(console, false)
    session.onFinish = () => send.lia('LIA: stop')

    setTimeout(() => session.evaluate(code), 0)
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
        session.evaluate(line)
      }
    })
    send.handle('stop', () => {
      session.stop()
      console.log('execution stopped')
    })

    // let the terminal open before the first output arrives
    setTimeout(() => session.evaluate(code), 0)
    return 'LIA: terminal'
  },
}
