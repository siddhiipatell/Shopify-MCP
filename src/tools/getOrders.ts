import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";

// Input schema for getOrders
const GetOrdersInputSchema = z.object({
  query: z.string().optional().describe("Optional search query to filter orders (e.g., 'email:customer@example.com', 'status:open')"),
  limit: z.number().default(10).describe("Maximum number of orders to return (default: 10)"),
  after: z.string().optional().describe("Cursor for pagination - get items after this cursor"),
  before: z.string().optional().describe("Cursor for pagination - get items before this cursor"),
  reverse: z.boolean().optional().default(false).describe("Reverse the order of the returned orders"),
  sortKey: z.enum(["CREATED_AT", "CUSTOMER_NAME", "ID", "ORDER_NUMBER", "PROCESSED_AT", "TOTAL_PRICE", "UPDATED_AT"]).optional().default("PROCESSED_AT").describe("Sort key for ordering results (default: PROCESSED_AT)")
});

type GetOrdersInput = z.infer<typeof GetOrdersInputSchema>;

// Will be initialized in index.ts
let shopifyClient: GraphQLClient;

/**
 * Tool for fetching orders with their details and navigation support
 * @returns {Object} List of orders with their details including customer, line items, and pagination info
 */
const getOrders = {
  name: "get-orders",
  description: "Get all orders or search/filter orders by various criteria, including order status, customer, and financial details",
  schema: GetOrdersInputSchema,

  // Add initialize method to set up the GraphQL client
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: GetOrdersInput) => {
    try {
      const { query: searchQuery, limit, after, before, reverse, sortKey } = input;

      // Build GraphQL query
      const query = gql`
        query GetOrders(
          $first: Int
          $last: Int
          $after: String
          $before: String
          $query: String
          $reverse: Boolean
          $sortKey: OrderSortKeys
        ) {
          orders(
            first: $first
            last: $last
            after: $after
            before: $before
            query: $query
            reverse: $reverse
            sortKey: $sortKey
          ) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              cursor
              node {
                id
                name
                email
                phone
                createdAt
                updatedAt
                processedAt
                closedAt
                cancelledAt
                cancelReason
                confirmed
                test
                displayFinancialStatus
                displayFulfillmentStatus
                subtotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalTaxSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalShippingPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalDiscountsSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  id
                  firstName
                  lastName
                  email
                  phone
                }
                shippingAddress {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                billingAddress {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      discountedUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      variant {
                        id
                        title
                        sku
                        image {
                          url
                          altText
                        }
                      }
                      product {
                        id
                        title
                        handle
                      }
                    }
                  }
                }
                fulfillments {
                  id
                  status
                  createdAt
                  updatedAt
                  trackingInfo {
                    company
                    number
                    url
                  }
                }
                tags
                note
              }
            }
          }
        }
      `;

      // Prepare variables
      const variables: {
        first?: number;
        last?: number;
        after?: string;
        before?: string;
        query?: string;
        reverse?: boolean;
        sortKey?: string;
      } = {
        reverse,
        sortKey
      };

      // Handle pagination
      if (before) {
        variables.last = limit;
        variables.before = before;
      } else {
        variables.first = limit;
        if (after) {
          variables.after = after;
        }
      }

      // Add search query if provided
      if (searchQuery) {
        variables.query = searchQuery;
      }

      const data: any = await shopifyClient.request(query, variables);
      
      return {
        orders: data.orders.edges.map((edge: any) => edge.node),
        pageInfo: data.orders.pageInfo,
        cursors: data.orders.edges.map((edge: any) => edge.cursor)
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }
};

export default getOrders;
