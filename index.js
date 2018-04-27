
const fs = require('fs');

let a = fs.createReadStream('./tests/a.txt');
let b = fs.createReadStream('./tests/b.txt');
let c = fs.createWriteStream('./tests/c.txt');

const edit = require('./edit.js').edit

a.pipe(edit(b, { replace: 'X' })).pipe(c)

c.on('close', () => {
  console.log(fs.readFileSync('./tests/c.txt').toString())
});

