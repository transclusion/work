module.exports = {
  routes: [
    {
      src: '/',
      dest: './package.json'
    },
    {src: '/(.*)', dest: './$1'}
  ]
}
