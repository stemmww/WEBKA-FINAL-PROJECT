const express = require('express');
const Recipe = require('../models/Recipe');
const authMiddleware = require('../middleware/auth');
const Favorite = require('../models/Favorite');
const router = express.Router();

// 📌 Создать новый рецепт
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, description, ingredients, instructions, cookingTime, category, imageUrl } = req.body;

        const newRecipe = new Recipe({
            name: String,
            
        });

        await newRecipe.save();
        res.status(201).json({ message: 'Рецепт успешно создан!', recipe: newRecipe });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании рецепта', error: error.message });
    }
});

// 📌 Получить все рецепты
router.get('/', authMiddleware, (req, res, next) => {
    console.log("✅ JWT Middleware: Token verified for user:", req.user);  // Log user info when accessing this route
    next();
}, async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user.id });
        res.json(favorites);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// 📌 Получить один рецепт по ID
router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('createdBy', 'name');

        if (!recipe) {
            return res.status(404).json({ message: 'Рецепт не найден' });
        }

        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении рецепта', error: error.message });
    }
});

// 📌 Обновить рецепт
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ message: 'Рецепт не найден' });
        }

        if (recipe.createdBy.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Вы не можете редактировать этот рецепт' });
        }

        Object.assign(recipe, req.body);
        await recipe.save();

        res.status(200).json({ message: 'Рецепт обновлен', recipe });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении рецепта', error: error.message });
    }
});

// 📌 Удалить рецепт
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ message: 'Рецепт не найден' });
        }

        if (recipe.createdBy.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Вы не можете удалить этот рецепт' });
        }

        await recipe.deleteOne();
        res.status(200).json({ message: 'Рецепт удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении рецепта', error: error.message });
    }
});

module.exports = router;
