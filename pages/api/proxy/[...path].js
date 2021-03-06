import httpProxy from "http-proxy";
import Cookies from "cookies";
import url from "url";

// Get the actual API_URL as an environment variable. For real
// applications, you might want to get it from 'next/config' instead.
const API_URL = process.env.API_URL;
const SERVER_KEY = process.env.SERVER_KEY;
const SERVER_CSR = process.env.SERVER_CSR;

const proxy = httpProxy.createProxyServer({
  ssl: {
    key: SERVER_KEY,
    cert: SERVER_CSR,
  },
  target: "https://auth-proxy-test-front.herokuapp.com/",
  secure: true,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

console.log("API_URL AQUI", API_URL);

export default (req, res) => {
  console.log("proxy");
  return new Promise((resolve, reject) => {
    const pathname = url.parse(req.url).pathname;
    const isLogin = pathname === "/api/proxy/login";

    const cookies = new Cookies(req, res);
    const authToken = cookies.get("auth-token");

    // Rewrite URL, strip out leading '/api'
    // '/api/proxy/*' becomes '${API_URL}/*'
    console.log("API_URL", API_URL);
    console.log("req.url", req.url);
    console.log("req.url parse", url.parse(req.url).pathname);
    console.log("req.headers.host", req.headers.host);
    // console.log("req", req);

    // console.log("req.body", req.body);
    req.url = req.url.replace(/^\/api\/proxy/, "");

    console.log("pos req.url", req.url);
    console.log("pos req.url parse", url.parse(req.url).pathname);

    // Don't forward cookies to API
    req.headers.cookie = "";

    // Set auth-token header from cookie
    if (authToken) {
      req.headers["auth-token"] = authToken;
    }

    proxy
      .once("proxyRes", (proxyRes, req, res) => {
        console.log("proxy once");
        console.log("proxy once req.url", req.url);
        console.log("proxy once req.url parse", url.parse(req.url).pathname);
        console.log("proxy once req.headers.host", req.headers.host);

        let responseBody = "";
        proxyRes.on("data", (chunk) => {
          console.log("proxy data", chunk);

          responseBody += chunk;
        });

        if (isLogin) {
          proxyRes.on("end", () => {
            try {
              console.log("proxy end", responseBody);

              const { authToken } = JSON.parse(responseBody);
              const cookies = new Cookies(req, res);
              cookies.set("auth-token", authToken, {
                httpOnly: true,
                sameSite: "lax", // CSRF protection
              });

              res.status(200).json({ loggedIn: true });
              console.log("proxy resolve");
              console.log("======================");
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        } else {
          proxyRes.on("end", () => {
            try {
              console.log("responseBody", responseBody);
              console.log("proxy resolve");
              console.log("======================");
              resolve();
            } catch (err) {
              console.log("err", err);
              reject(err);
            }
          });
          // resolve();
        }
      })
      // .once("proxyReq", (proxyReq, req, res, options) => {
      //   console.log("proxyReq", proxyReq);
      // })
      .once("error", (error) => {
        console.log("error proxy", error);
        reject();
      })
      .web(req, res, {
        target: API_URL,
        autoRewrite: false,
        selfHandleResponse: isLogin,
      });
  });
};
