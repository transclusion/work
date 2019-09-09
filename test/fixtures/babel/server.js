function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function load() {
  await delay(100);
  return { name: "Foo" };
}

export default async (req, res) => {
  const data = await load();
  res.end(`<div id="root">Hello, ${data.name}!</div>
<script src="/browser.js"></script>`);
};
