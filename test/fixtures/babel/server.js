function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function load() {
  await delay(100);
  return { name: "Foo" };
}

export default async (req, res) => {
  const data = await load();
  res.end(`Hello, ${data.name}!`);
};
