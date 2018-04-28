const fs = require('fs-extra');
const path = require('path');
const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const edit = require('../index.js').edit
const debug = require('debug')('edit')
fs.mkdirp(path.join(__dirname, '.test-output'));

const read = fs.createReadStream;
const write = fs.createWriteStream

function files(a, b , c) {
  let path_a = path.join(__dirname, 'samples', a);
  let path_b = path.join(__dirname, 'samples', b);
  let path_c = path.join(__dirname, '.test-output', c);

  let f = {
    src: read(path_a),
    rep: read(path_b),
    dest: write(path_c),
    content: () => { return fs.readFileSync(path_c).toString() },
    sizeCalc: (replace_token) => {
      let size_a = fs.statSync(path_a).size
      let size_b = fs.statSync(path_b).size
      let size_c = fs.statSync(path_c).size
      let expected = (size_a + size_b) - replace_token.length;
      return expected == size_c;
    }
  }
  return f;
}

describe('edit:replace src.size < bufsiz', () => {
  it('should insert the stream content', (done) => {
    let f = files('a.txt', 'b.txt', '1.out')
    let token = 'X';
    f.src.pipe(edit(f.rep, { replace: token })).pipe(f.dest)
    f.dest.on('close', () => {
      expect(f.content()).to.equal('aaabbbcccddd');
      expect(f.sizeCalc(token))
      done()
    })
  });
});

describe('edit:replace src.size > bufsiz', () => {
  it('should insert the stream content', (done) => {
    let f = files('long.txt', 'mark.txt', '2.out')
    let token = '<edit>';
    f.src.pipe(edit(f.rep, { replace: token })).pipe(f.dest)
    f.dest.on('close', () => {
      expect(f.sizeCalc(token))
      done()
    })
  });
});

describe('edit:replace src.size > bufsiz & rep.size > bufsiz', () => {
  it('should insert the stream content', (done) => {
    let f = files('long.txt', 'x.txt', '3.out')
    let token = '<edit>';
    f.src.pipe(edit(f.rep, { replace: token })).pipe(f.dest)
    f.dest.on('close', () => {
      expect(f.sizeCalc(token))
      done()
    })
  });
});

/*

(function () {
  let src_path = './tests/long-edit2.txt';
  let replace_path = './tests/mark.txt';
  let dest_path = './tests/longest2.txt';

  let src_s = fs.createReadStream(src_path)
  let replace_s = fs.createReadStream(replace_path)
  let dest_s = fs.createWriteStream(dest_path)
  let replace_token = '<edit>';

  src_s.pipe(edit(replace_s, { replace: replace_token })).pipe(dest_s)

  dest_s.on('close', () => {
    console.log('test 3')

    let src_size = fs.statSync(src_path).size
    let replace_size = fs.statSync(replace_path).size
    let dest_size = fs.statSync(dest_path).size
    let expected = (src_size + replace_size) - replace_token.length;
    console.log(`src: ${src_size}, replace: ${replace_size}, dest: ${dest_size}, expected: ${expected} result: ${dest_size == expected}`)
  });
})();

*/