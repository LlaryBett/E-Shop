/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} price
 * @property {number} [salePrice]
 * @property {string[]} images
 * @property {string} category
 * @property {string} [subcategory]
 * @property {string} brand
 * @property {number} rating
 * @property {number} reviewCount
 * @property {number} stock
 * @property {string[]} tags
 * @property {ProductVariant[]} [variants]
 * @property {Object.<string, string>} [specifications]
 * @property {boolean} [featured]
 * @property {boolean} [trending]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} name
 * @property {string} value
 * @property {number} [price]
 * @property {number} [stock]
 */

/**
 * @typedef {Object} ProductFilter
 * @property {string[]} [categories]
 * @property {string[]} [brands]
 * @property {[number, number]} [priceRange]
 * @property {number} [rating]
 * @property {boolean} [inStock]
 * @property {boolean} [onSale]
 */

/**
 * @typedef {Object} ProductSort
 * @property {'price'|'rating'|'title'|'createdAt'} field
 * @property {'asc'|'desc'} direction
 */

// Export empty objects to maintain import compatibility
export const Product = {};
export const ProductVariant = {};
export const ProductFilter = {};
export const ProductSort = {};