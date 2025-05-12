const http = require("http");
const url = require("url");
const queeryString = require("querystring");
const fs = require("fs/promises");
const readFileAndParse = require("./products");
const { parse, resolve } = require("path");

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  const files = await fs.readdir(__dirname);
  let textFile = "";

  files.map((item) => {
    if (item === "test.txt") {
      textFile += item;
    }
  });

  if (parsedUrl.pathname === "/products" && req.method === "GET") {
    const products = await readFileAndParse("products.json", true);
    const query = queeryString.parse(parsedUrl.query);
    let page = Number(query.page) || 1;
    let take = Number(query.take) || 10;
    const pricefrom = Number(query.priceFrom) || 1;
    const priceto = Number(query.priceTo) || 300;
    take = Math.min(10, take);
    const start = (page - 1) * take;
    const end = page * take;

    const filteredProcuts = products.filter(
      (item) => item.price > pricefrom && item.price < priceto
    );

    res.writeHead(200, {
      "content-type": "application/json",
    });
    res.end(JSON.stringify(filteredProcuts.slice(start, end)));
  }
  if (parsedUrl.pathname === "/products" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      const { title, category, price } = JSON.parse(body);

      if (!price || !category || !title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "ყველა ველი აუცილებელია" }));
        return;
      }

      const products = await readFileAndParse("products.json", true);
      const lastId = products[products.length - 1]?.id || 0;
      const newObj = {
        id: lastId + 1,
        price,
        category,
        title,
      };
      products.push(newObj);
      await fs.writeFile("products.json", JSON.stringify(products));
    });
    res.end("product added Successfully");
  }

  if (parsedUrl.pathname.startsWith("/products/") && req.method === "DELETE") {
    const id = parsedUrl.pathname.split("/")[2];
    const products = await readFileAndParse("products.json", true);
    const index = products.findIndex((el) => el.id === Number(id));
    // console.log(index);
    if (index === -1) {
      res.writeHead(404, {
        "content-type": "application/json",
      });
      res.end("object not found");
      return;
    }

    const deletedData = products.splice(index, 1);
    await fs.writeFile("products.json", JSON.stringify(products));

    res.end(JSON.stringify(deletedData));
  }

  if (parsedUrl.pathname.startsWith("/products/") && req.method === "PUT") {
    const id = parsedUrl.pathname.split("/")[2];
    const products = await readFileAndParse("products.json", true);
    const index = products.findIndex((el) => el.id === Number(id));
    if (index === -1) {
      res.writeHead(404, {
        "content-type": "application/json",
      });
      res.end("object not found");
      return;
    }
    let body = "";
    const updatePost = {};
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      const { category, title } = JSON.parse(body);

      if (!category || !title) {
        res.writeHead(404, {
          "content-type": "application/json",
        });
        res.end("404 error");
      }

      if (category) {
        updatePost.category = category;
      }
      if (title) {
        updatePost.title = title;
      }

      products[index] = {
        ...products[index],
        ...updatePost,
      };

      await fs.writeFile("products.json", JSON.stringify(products));

      res.end(JSON.stringify(products[index]));
    });
  }

  if (parsedUrl.pathname.startsWith("/time/") && req.method === "GET") {
    const city = parsedUrl.pathname.split("/")[2];

    const data = await fetch(
      `https://www.icalendar37.net/gadgets/timeInTheCity/?q=${city}`
    );
    const response = await data.json();
    if (!response.city) {
      res.writeHead(404, {
        "content-type": "application/json",
      });
      return res.end("city not found");
    }
    res.writeHead(200, {
      "content-type": "application/json",
    });
    res.end(JSON.stringify(response.time));
  }

  if (parsedUrl.pathname === "/" && req.method === "GET") {
    res.writeHead(200, {
      "content-type": "text/html",
    });
    res.end("Welcome Batono Davit");
  }

  if (parsedUrl.pathname === "/delete-file" && req.method === "GET") {
    const query = queeryString.parse(parsedUrl.query);
    if (textFile) {
      await fs.unlink(query.filepath, "utf-8");
      res.writeHead(200, {
        "content-type": "text/html",
      });
      res.end("file deleted succesfully");
    } else {
      res.writeHead(404, {
        "content-type": "text/html",
      });
      res.end("file Not found");
    }
  }
});

server.listen(4000, () => {
  console.log("server runnig on http://localhost:4000");
});
