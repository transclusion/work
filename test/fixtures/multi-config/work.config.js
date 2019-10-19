module.exports = [
  {
    builds: [{src: './server1.js', target: 'server', dir: './dist'}],
    routes: [{src: '/', dest: './dist/server1.js'}]
  },
  {
    builds: [{src: './server2.js', target: 'server', dir: './dist'}],
    routes: [{src: '/', dest: './dist/server2.js'}]
  }
]
