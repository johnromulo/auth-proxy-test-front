import httpProxy from "http-proxy";
import Cookies from "cookies";
import url from "url";

// Get the actual API_URL as an environment variable. For real
// applications, you might want to get it from 'next/config' instead.
const API_URL = process.env.API_URL;

const proxy = httpProxy.createProxyServer();

export const config = {
  api: {
    bodyParser: true,
  },
};

export default (req, res) => {
  console.log("proxy");
  return new Promise((resolve, reject) => {
    const pathname = url.parse(req.url).pathname;
    const isLogin = pathname === "/api/proxy/login";

    const cookies = new Cookies(req, res);
    const authToken = cookies.get("auth-token");

    // Rewrite URL, strip out leading '/api'
    // '/api/proxy/*' becomes '${API_URL}/*'
    console.log("req.url", req.url);
    console.log("req.url parse", url.parse(req.url).pathname);
    console.log("req.body", req.body);
    req.url = req.url.replace(/^\/api\/proxy/, "");

    // Don't forward cookies to API
    req.headers.cookie = "";

    // Set auth-token header from cookie
    if (authToken) {
      req.headers["auth-token"] = authToken;
    }

    proxy
      .once("proxyRes", (proxyRes, req, res) => {
        console.log("proxy once");

        if (isLogin) {
          let responseBody = "";
          proxyRes.on("data", (chunk) => {
            console.log("proxy data", chunk);

            responseBody += chunk;
          });

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
              console.log("======================");
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        } else {
          console.log("======================");
          resolve();
        }
      })
      .once("error", reject)
      .web(req, res, {
        target: API_URL,
        autoRewrite: false,
        selfHandleResponse: isLogin,
      });
  });
};
