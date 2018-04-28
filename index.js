const debug = require('debug')('edit');
const { Transform } = require('stream');

class Edit extends Transform {
  constructor(other, opts) {
    super({});

    if (opts.replace) {
      this._edit_fn = (chunk) => {
        let i = chunk.indexOf(opts.replace);
        if (~i) {
          let part_a = chunk.slice(0, i);
          let part_b = chunk.slice(i + opts.replace.length, chunk.length);
          this.push(part_a);
          return { rem_data: part_b };
        } else return false;
      }
    } else {
      this._edit_fn = () => false;
    }

    this.o = {
      stream: other,
      blocking: false,
      closed: false
    };
    this.o.stream.pause()
    this._push_bound = this.push.bind(this)
  };

  _final(cb) {
    if (!this.o.stream.closed) {
      this.o.stream.close();
    }
    cb()
  }

  _transform(chunk, enc, cb) {

    let edit = this._edit_fn(chunk, enc)
    if (edit) {
      return this._init_insert_stream(cb, edit);
    }

    if (!this.o.blocking) {
      this.push(chunk)
      cb();
    }
  }

  _init_insert_stream(cb, edit) {
    this.o.blocking = this.o.blocked = true;
    this.o.stream.on('data', this._push_bound);
    this.o.stream.on('close', () => {
      this.o.blocking = false;
      if (edit.rem_data) this.push(edit.rem_data);
      cb()
    });
    this.o.stream.resume();
  }
}

module.exports.Edit = Edit;
module.exports.edit = (a, b) => { return new Edit(a, b); };