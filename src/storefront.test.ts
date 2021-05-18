import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { _getCheckoutId } from "./storefront.ts";

Deno.test("checkout id from url works", () => {
  assertEquals(
    _getCheckoutId(
      "https://reima-us.myshopify.com/7443939383/checkouts/0d0e0a1e867f0f6c0282669140fdcbe0?key=e29f01f183f75e5937ac8fb0022c20a3&step=contact_information",
    ),
    "Z2lkOi8vc2hvcGlmeS9DaGVja291dC8wZDBlMGExZTg2N2YwZjZjMDI4MjY2OTE0MGZkY2JlMD9rZXk9ZTI5ZjAxZjE4M2Y3NWU1OTM3YWM4ZmIwMDIyYzIwYTM=",
  );
});
