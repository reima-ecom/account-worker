# Shopify account page worker

This worker will rewrite the page from the origin with the customer data received from Shopify. If the customer is not logged in (based on the `Shopify Customer Token` cookie) it redirects to `/account/login/`. Only executes for urls with a pathname that begins with `/account`.

## Development

In order to debug the worker locally, you can run `wrangler dev`. However, since you probably want to edit the underlying (origin) page as well, you need to set up some tunneling.

1. Run `hugo server` for whatever site you want to use as the origin
2. Run `ngrok http 1313` in order to tunnel traffic from the internet to localhost
3. Run `wrangler dev --host [public url from ngrok]` to run the worker

Some things to take into acconut:

- Wrangler for some reason runs unauthenticated if you specify a host. While otherwise ok, it means that this method cannot be used to debug workers that use the KV store.
- ngrok rate limits free tunnels to 20 requests per minute. Keep this in mind for debugging sites with fonts, media, and other auxillary requests.

