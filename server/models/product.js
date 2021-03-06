module.exports = function (mongoose) {
    var Schema = mongoose.Schema;

    var Product = mongoose.model('Product', new Schema({
        name: {
            type: String,
            required: true
        },
        inPromotion: {
            type: Boolean,
            default: false
        },
        heading: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            required: true
        },
        subCategory: {
            type: Array
        },
        inventoryId: {
            type: Number,
            required: true,
            unique: true
        },
        picturePreview: {
            type: String
        },
        picturesOthers: {
            type: Array
        },
        priceProfessional: {
            type: Number
        },
        priceHome: {
            type: Number
        },
        pricePromotionalHome: {
            type: Number
        },
        pricePromotionalProfessional: {
            type: Number
        },
        reviews: {
            type: 'Mixed'
        },
        quantity: {
            type: String
        },
        updated: {
            type: Date,
            default: Date.now
        }
    }));

    return Product;
}