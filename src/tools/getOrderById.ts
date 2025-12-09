import type { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { z } from "zod";

// Input schema for getOrderById
const GetOrderByIdInputSchema = z.object({
  orderId: z.string().min(1).describe("The GID of the order to fetch (e.g., \"gid://shopify/Order/1234567890\")")
});

type GetOrderByIdInput = z.infer<typeof GetOrderByIdInputSchema>;

// Will be initialized in index.ts
let shopifyClient: GraphQLClient;

/**
 * Tool for fetching a specific order by ID with all its details
 * @returns {Object} Order details including customer, line items, and financial information
 */
const getOrderById = {
  name: "get-order-by-id",
  description: "Get a specific order by ID including customer details, line items, financial data, and fulfillment status",
  schema: GetOrderByIdInputSchema,

  // Add initialize method to set up the GraphQL client
  initialize(client: GraphQLClient) {
    shopifyClient = client;
  },

  execute: async (input: GetOrderByIdInput) => {
    try {
      const { orderId } = input;

      const query = gql`
        query GetOrderById($id: ID!) {
          order(id: $id) {
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
              presentmentMoney {
                amount
                currencyCode
              }
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            totalTaxSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            totalShippingPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            totalDiscountsSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
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
              defaultAddress {
                address1
                address2
                city
                province
                country
                zip
              }
            }
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
              name
              company
              phone
            }
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
              name
              company
              phone
            }
            lineItems(first: 250) {
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
                    presentmentMoney {
                      amount
                      currencyCode
                    }
                  }
                  discountedUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                    presentmentMoney {
                      amount
                      currencyCode
                    }
                  }
                  originalTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                    presentmentMoney {
                      amount
                      currencyCode
                    }
                  }
                  discountedTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                    presentmentMoney {
                      amount
                      currencyCode
                    }
                  }
                  variant {
                    id
                    title
                    sku
                    price
                    image {
                      url
                      altText
                    }
                  }
                  product {
                    id
                    title
                    handle
                    productType
                    vendor
                  }
                  customAttributes {
                    key
                    value
                  }
                }
              }
            }
            fulfillments {
              id
              status
              createdAt
              updatedAt
              deliveredAt
              estimatedDeliveryAt
              inTransitAt
              trackingInfo {
                company
                number
                url
              }
              fulfillmentLineItems(first: 250) {
                edges {
                  node {
                    id
                    quantity
                    lineItem {
                      id
                      title
                    }
                  }
                }
              }
            }
            shippingLine {
              title
              code
              source
              originalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              discountedPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
            transactions(first: 250) {
              id
              kind
              status
              amount
              gateway
              createdAt
              processedAt
              errorCode
            }
            refunds {
              id
              createdAt
              note
              totalRefundedSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              refundLineItems(first: 250) {
                edges {
                  node {
                    quantity
                    restockType
                    lineItem {
                      id
                      title
                    }
                  }
                }
              }
            }
            risks(first: 10) {
              level
              message
              display
            }
            discountApplications(first: 10) {
              edges {
                node {
                  allocationMethod
                  targetSelection
                  targetType
                  value {
                    ... on MoneyV2 {
                      amount
                      currencyCode
                    }
                    ... on PricingPercentageValue {
                      percentage
                    }
                  }
                }
              }
            }
            tags
            note
            customerLocale
            sourceIdentifier
            sourceName
          }
        }
      `;

      const variables = {
        id: orderId
      };

      const data = await shopifyClient.request(query, variables);
      
      if (!data.order) {
        throw new Error(`Order not found with ID: ${orderId}`);
      }

      return data.order;
    } catch (error: any) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }
};

export { getOrderById };
