function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function load() {
  await delay(100);
  return { name: "Foo" };
}

load().then(data => {
  document.getElementById("root").innerHTML = `Hello, ${data.name}! (browser)`;
});
