export type ShopifyStorefront = {
  store: string;
  token: string;
};

export const getShopifyStorefront = (
  request: Request,
): ShopifyStorefront | Promise<ShopifyStorefront> => {
  return {
    store: "reima-us",
    token: "d2990d8e29e763239f8e8ff6cefc9ebe",
  };
};

const query = async (storefront: ShopifyStorefront, graphQl: string) => {
  const resp = await fetch(
    `https://${storefront.store}.myshopify.com/api/2020-01/graphql`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefront.token,
      },
      method: "POST",
      body: JSON.stringify({ query: graphQl }),
    },
  );
  if (!resp.ok) throw new Error("Could not query graphQl");
  const data = await resp.json();
  if (data.errors && data.errors.length) {
    console.log("Errors:");
    data.errors.forEach((e: unknown) => {
      console.log(e);
    });
    throw new Error("Error querying graphQl");
  }
  return data.data;
};

export const getCustomerToken = async (
  storefront: ShopifyStorefront,
  email: string,
  password: string,
): Promise<string> => {
  const {
    customerAccessTokenCreate: { customerUserErrors, customerAccessToken },
  } = await query(
    storefront,
    `
    mutation {
      customerAccessTokenCreate(input: {email: "${email}", password: "${password}"}) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
    `,
  );
  if (customerAccessToken) return customerAccessToken.accessToken;
  console.log(customerUserErrors[0]);
  throw new Error("Could not get access token");
};

export type CustomerOrder = {
  number: string;
  url: string;
};

export type CustomerInfo = {
  name: string;
  email: string;
  orders: CustomerOrder[];
};

export const getCustomerInfo = async (
  storefront: ShopifyStorefront,
  token: string,
): Promise<CustomerInfo> => {
  const { customer } = await query(
    storefront,
    `
    {
      customer(customerAccessToken: "${token}") {
        displayName
        email
        orders(first: 100) {
          edges {
            node {
              name
              statusUrl
            }
          }
        }
      }
    }`,
  );
  return {
    name: customer.displayName,
    email: customer.email,
    orders: customer.orders.edges.map(({ node }: any) => ({
      number: node.name,
      url: node.statusUrl,
    })),
  };
};
