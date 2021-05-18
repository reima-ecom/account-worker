import "https://raw.githubusercontent.com/ericselin/worker-types/v1.0.1/cloudflare-worker-types.ts";
import {
  associateCheckoutWithCustomer,
  getCustomerInfo,
  getCustomerToken,
  getShopifyStorefront,
} from "./storefront.ts";
import type { CustomerOrder, ShopifyStorefront } from "./storefront.ts";

const getCustomerTokenFromCookie = (request: Request) => {
  const cookie = request.headers.get("Cookie");
  const cookieMatch = cookie?.match(
    /Shopify Customer Token=(\w+);/,
  );
  if (!cookieMatch) return undefined;
  return cookieMatch[1];
};

const getCustomerTokenSetCookie = (token: string): string =>
  `Shopify Customer Token=${token}; HttpOnly; SameSite=Strict; Path=/account`;

type RequestHandler = (request: Request) => Response | Promise<Response>;

const loginForm: RequestHandler = (request) => {
  return fetch(request);
};

const loginRedirect = (store: ShopifyStorefront): RequestHandler =>
  async (request) => {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid");
    }
    const token = await getCustomerToken(store, email, password);
    let redirectLocation = '/account/';
    // if we have a checkout_url, associate that checkout with the customer and redirect to checkout
    const checkoutUrl = new URL(request.url).searchParams.get('checkout_url');
    if (checkoutUrl) {
      await associateCheckoutWithCustomer(store, checkoutUrl, token);
      redirectLocation = checkoutUrl;
    }
    return new Response("Redirecting", {
      status: 302,
      headers: {
        "Location": redirectLocation,
        "Set-Cookie": getCustomerTokenSetCookie(token),
      },
    });
  };

const binder = (obj: Record<string, unknown>) => ({
  element: (element: Element) => {
    const bind = element.getAttribute("bind");
    if (bind) {
      const value = obj[bind];
      if (typeof value === "string") {
        element.setInnerContent(value);
      }
    }
  },
});

const orders = (orders: CustomerOrder[]) => ({
  element: (element: Element) => {
    element.setInnerContent(
      orders.map(
        (o) => `<li><a href="${o.url}">${o.number}</a></li>`,
      ).join("\n"),
      { html: true },
    );
  },
});

const getRoot = (store: ShopifyStorefront, token: string): RequestHandler =>
  async (request) => {
    const response = await fetch(request);
    const customer = await getCustomerInfo(store, token);

    let rewriter = new HTMLRewriter().on("[bind]", binder(customer));
    if (customer.orders.length) {
      rewriter = rewriter.on("#orders", orders(customer.orders));
    }
    return rewriter.transform(response);
  };

const handler = async (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  const token = getCustomerTokenFromCookie(request);
  const route = `${request.method}:${url.pathname}`;
  const store = await getShopifyStorefront(request);

  // these routes can be accessed by anyone
  switch (route) {
    case "GET:/account/login":
    case "GET:/account/login/":
      return loginForm(request);
    case "POST:/account/login/":
      return loginRedirect(store)(request);
  }

  // from now on, only authenticated requests
  if (!token) {
    return new Response("Redirecting to login", {
      status: 302,
      headers: { "Location": "/account/login/" },
    });
  }

  switch (route) {
    case "GET:/account/":
      return getRoot(store, token)(request);
    default:
      return new Response("Not found", { status: 404 });
  }
};

addEventListener("fetch", (event) => {
  // only enable for account pages
  if (new URL(event.request.url).pathname.startsWith("/account")) {
    event.respondWith(handler(event));
  }
});
