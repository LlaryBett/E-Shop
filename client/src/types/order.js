/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} userId
 * @property {OrderItem[]} items
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} shipping
 * @property {number} total
 * @property {OrderStatus} status
 * @property {Address} shippingAddress
 * @property {Address} billingAddress
 * @property {string} paymentMethod
 * @property {PaymentStatus} paymentStatus
 * @property {Date} orderDate
 * @property {Date} [estimatedDelivery]
 * @property {string} [trackingNumber]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} productId
 * @property {string} productTitle
 * @property {string} productImage
 * @property {number} quantity
 * @property {number} price
 * @property {string} [variant]
 */

/**
 * @typedef {Object} Address
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} zipCode
 * @property {string} country
 */

/**
 * @typedef {'pending'|'processing'|'shipped'|'delivered'|'cancelled'} OrderStatus
 */

/**
 * @typedef {'pending'|'paid'|'failed'|'refunded'} PaymentStatus
 */

// Export empty objects to maintain import compatibility
export const Order = {};
export const OrderItem = {};
export const Address = {};
export const OrderStatus = {};
export const PaymentStatus = {};