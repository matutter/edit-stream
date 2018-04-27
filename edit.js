
const debug = require('debug')('edit');
const { Transform } = require('stream');

class Edit extends Transform {
  constructor(other, opts) {
    super({});

    if (opts.replace) {
      this._edit_fn = (chunk) => {
        let i = chunk.indexOf(opts.replace);
        if(~i) {
          this.push(chunk.slice(0, i));
          return {
            rem_data: chunk.slice(i + opts.replace.length, chunk.length)
          }
        } else return false;
      }
    } else {
      throw Error('Bad argument')
    }

    this._other = other;
    this._is_blocking = false;
    this._other.pause()
    this.on('close', ()=> {
      this._other.close();
    })
  };

  _transform(chunk, enc, cb) {

    let edit = this._edit_fn(chunk, enc)
    if (edit) {
      this._init_insert_stream(cb, edit);
    }

    if(!this._is_blocking) cb();
  }

  _init_insert_stream(cb, edit) {
    this._is_blocking = true;
    let s = this._other;
    s.on('data', (d) => { this.push(d); })
    s.on('close', () => {
      this._is_blocking = false;
      if (edit.rem_data) this.push(edit.rem_data);
      cb()
    });
    s.resume();
  }

}

module.exports.edit = (a, b) => { return new Edit(a, b); }