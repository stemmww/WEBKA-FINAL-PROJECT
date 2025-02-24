const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }] // Только ID рецептов
});

module.exports = mongoose.model('Favorite', FavoriteSchema);