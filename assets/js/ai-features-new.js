
// AI Features for MealMatrix
import GeminiClient from './gemini-client-latest.js';

export class MealAI {
    constructor() {
        this.client = new GeminiClient();
        this.userProfile = null;
    }

    async loadUserProfile() {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const profileRef = firebase.database().ref(`users/${user.uid}/profile`);
            const snapshot = await profileRef.once("value");
            this.userProfile = snapshot.val() || {};
            return this.userProfile;
        } catch (error) {
            console.error("Error loading user profile:", error);
            return null;
        }
    }

    checkDietaryConflicts(foods) {
        if (!this.userProfile || !foods || !Array.isArray(foods)) return [];

        const warnings = [];
        const allergies = this.userProfile.allergies ? 
            this.userProfile.allergies.toLowerCase().split(/[,\n]/).map(a => a.trim()) : [];
        const restrictions = this.userProfile.restrictions ?
            this.userProfile.restrictions.toLowerCase().split(/[,\n]/).map(r => r.trim()) : [];
        const dietType = this.userProfile.dietType;

        foods.forEach(food => {
            const foodName = typeof food === "string" ? food : food.name || "";
            if (!foodName) return;
            
            const foodLower = foodName.toLowerCase();
            
            allergies.forEach(allergy => {
                if (foodLower.includes(allergy)) {
                    warnings.push({
                        type: "allergy",
                        severity: "high",
                        message: `⚠️ Warning: ${foodName} conflicts with your allergy to ${allergy}`
                    });
                }
            });

            restrictions.forEach(restriction => {
                if (foodLower.includes(restriction)) {
                    warnings.push({
                        type: "restriction",
                        severity: "medium",
                        message: `⚠️ Note: ${foodName} conflicts with your dietary restriction: ${restriction}`
                    });
                }
            });

            if (dietType) {
                const veganFoods = ["meat", "fish", "chicken", "beef", "pork", "lamb", "egg", "milk", "dairy", "cheese", "butter"];
                const vegetarianFoods = ["meat", "fish", "chicken", "beef", "pork", "lamb"];
                const pescatarianFoods = ["meat", "chicken", "beef", "pork", "lamb"];

                if (dietType === "vegan" && veganFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: "diet",
                        severity: "medium",
                        message: `Note: ${foodName} is not suitable for a vegan diet`
                    });
                } else if (dietType === "vegetarian" && vegetarianFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: "diet",
                        severity: "medium",
                        message: `Note: ${foodName} is not suitable for a vegetarian diet`
                    });
                } else if (dietType === "pescatarian" && pescatarianFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: "diet",
                        severity: "medium",
                        message: `Note: ${foodName} is not suitable for a pescatarian diet`
                    });
                }
            }
        });

        return warnings;
    }

    formatAnalysisResponse(parsedResult) {
        const foodItems = (parsedResult.foods || []).map(food => 
            typeof food === "string" ? food : food.name || ""
        ).filter(Boolean);

        return {
            foodItems,
            nutrients: {
                calories: parsedResult.calories || parsedResult.macros?.calories || 0,
                protein: parsedResult.macros?.protein || 0,
                carbs: parsedResult.macros?.carbs || 0,
                fat: parsedResult.macros?.fat || 0
            },
            suggestions: parsedResult.suggestions || "",
            assessment: parsedResult.assessment || "",
            warnings: parsedResult.warnings || []
        };
    }

    parseAIResponse(result) {
        try {
            let text = result.text || "";
            
            const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                text = jsonMatch[1];
            }

            text = text.trim();
            if (!text.startsWith("{")) {
                const jsonStart = text.indexOf("{");
                const jsonEnd = text.lastIndexOf("}");
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    text = text.slice(jsonStart, jsonEnd + 1);
                }
            }

            return JSON.parse(text);
        } catch (error) {
            console.error("Error parsing AI response:", error);
            throw new Error("Could not parse AI response");
        }
    }

    async normalizeText(text) {
        try {
            const prompt = `Translate and normalize this meal description to English, preserving portion sizes and cooking methods: "${text}"`;
            const result = await this.client.generateContent(prompt);
            return result.text || text;
        } catch (error) {
            console.error("Text normalization failed:", error);
            return text;
        }
    }

    async analyzeMeal(mealText) {
        try {
            await this.loadUserProfile();
            console.log("Analyzing meal:", mealText);
            
            const normalizedText = await this.normalizeText(mealText);
            
            let dietaryContext = "";
            if (this.userProfile) {
                dietaryContext = `
                Consider the following dietary context:
                Diet Type: ${this.userProfile.dietType || "No specific diet"}
                Allergies: ${this.userProfile.allergies || "None"}
                Restrictions: ${this.userProfile.restrictions || "None"}
                Health Conditions: ${this.userProfile.healthConditions || "None"}
                `;
            }

            const prompt = `Analyze this meal description: "${normalizedText}"
            
            ${dietaryContext}
            
            Identify the foods, their approximate portions, and calculate nutritional values.
            Common Indian foods reference:
            - Rice (1 cup cooked): 200 calories, 45g carbs, 4g protein, 0g fat
            - Roti/Chapati (1 piece): 120 calories, 20g carbs, 3g protein, 3g fat
            - Dal (1 cup): 150 calories, 28g carbs, 9g protein, 1g fat
            - Aloo Sabji (1 cup): 180 calories, 35g carbs, 4g protein, 3g fat
            
            Return a detailed JSON object with this structure:
            {
                "foods": ["detailed list with portions"],
                "calories": number,
                "macros": {
                    "protein": number (in grams),
                    "carbs": number (in grams),
                    "fat": number (in grams)
                },
                "suggestions": "specific nutrition advice",
                "assessment": "detailed health assessment",
                "warnings": ["relevant warnings"]
            }`;

            const result = await this.client.generateContent(prompt);
            console.log("Raw analysis result:", result);
            
            const parsedResult = this.parseAIResponse(result);
            if (!parsedResult || !parsedResult.macros) {
                throw new Error("Invalid response format from AI service");
            }
            
            const formattedResult = this.formatAnalysisResponse(parsedResult);

            const conflictWarnings = this.checkDietaryConflicts(formattedResult.foodItems);
            if (conflictWarnings.length > 0) {
                formattedResult.warnings = [
                    ...formattedResult.warnings,
                    ...conflictWarnings.map(w => w.message)
                ];
            }
            
            console.log("Final analyzed result:", formattedResult);
            return formattedResult;
        } catch (error) {
            console.error("Meal analysis failed:", error);
            throw new Error("Failed to analyze meal: " + error.message);
        }
    }
}