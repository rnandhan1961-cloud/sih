// Game Loader Module for Shiksha Leap
// Handles loading and management of grade-specific games

class GameLoader {
    constructor() {
        this.gameCache = new Map();
        this.currentGrade = null;
        this.availableGames = {};
        this.init();
    }
    
    init() {
        this.loadGameIndex();
        console.log('Game Loader initialized');
    }
    
    // Load game index for all grades and subjects
    loadGameIndex() {
        this.availableGames = {
            6: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Science': ['science_game1.json', 'science_game2.json'],
                'Social Studies': ['social_game1.json', 'social_game2.json']
            },
            7: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Science': ['science_game1.json', 'science_game2.json'],
                'Social Studies': ['social_game1.json', 'social_game2.json']
            },
            8: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Science': ['science_game1.json', 'science_game2.json'],
                'Social Studies': ['social_game1.json', 'social_game2.json']
            },
            9: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Science': ['science_game1.json', 'science_game2.json'],
                'Social Studies': ['social_game1.json', 'social_game2.json']
            },
            10: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Science': ['science_game1.json', 'science_game2.json'],
                'Social Studies': ['social_game1.json', 'social_game2.json']
            },
            11: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Biology': ['biology_game1.json', 'biology_game2.json'],
                'Physics': ['physics_game1.json', 'physics_game2.json'],
                'Chemistry': ['chemistry_game1.json', 'chemistry_game2.json'],
                'Computer Science': ['computer_science_game1.json', 'computer_science_game2.json'],
                'Economics': ['economics_game1.json', 'economics_game2.json'],
                'Commerce': ['commerce_game1.json', 'commerce_game2.json'],
                'History': ['history_game1.json', 'history_game2.json'],
                'Business Mathematics': ['business_maths_game1.json', 'business_maths_game2.json'],
                'Accountancy': ['accountancy_game1.json', 'accountancy_game2.json'],
                'Civics': ['civics_game1.json', 'civics_game2.json']
            },
            12: {
                'English': ['english_game1.json', 'english_game2.json'],
                'Odia': ['odia_game1.json', 'odia_game2.json'],
                'Mathematics': ['maths_game1.json', 'maths_game2.json'],
                'Biology': ['biology_game1.json', 'biology_game2.json'],
                'Physics': ['physics_game1.json', 'physics_game2.json'],
                'Chemistry': ['chemistry_game1.json', 'chemistry_game2.json'],
                'Computer Science': ['computer_science_game1.json', 'computer_science_game2.json'],
                'Economics': ['economics_game1.json', 'economics_game2.json'],
                'Commerce': ['commerce_game1.json', 'commerce_game2.json'],
                'History': ['history_game1.json', 'history_game2.json'],
                'Business Mathematics': ['business_maths_game1.json', 'business_maths_game2.json'],
                'Accountancy': ['accountancy_game1.json', 'accountancy_game2.json'],
                'Civics': ['civics_game1.json', 'civics_game2.json']
            }
        };
    }
    
    // Get games for a specific grade and subject
    getGamesForSubject(grade, subject) {
        if (!this.availableGames[grade] || !this.availableGames[grade][subject]) {
            return [];
        }
        
        return this.availableGames[grade][subject].map(gameFile => ({
            id: gameFile.replace('.json', ''),
            file: gameFile,
            path: `/games/grade_${grade}/${gameFile}`
        }));
    }
    
    // Load a specific game
    async loadGame(grade, gameFile) {
        const cacheKey = `${grade}_${gameFile}`;
        
        // Check cache first
        if (this.gameCache.has(cacheKey)) {
            return this.gameCache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`/games/grade_${grade}/${gameFile}`);
            if (!response.ok) {
                throw new Error(`Failed to load game: ${response.statusText}`);
            }
            
            const gameData = await response.json();
            
            // Cache the game data
            this.gameCache.set(cacheKey, gameData);
            
            return gameData;
        } catch (error) {
            console.error('Error loading game:', error);
            
            // Return mock game data as fallback
            return this.getMockGameData(grade, gameFile);
        }
    }
    
    // Get mock game data for offline/fallback scenarios
    getMockGameData(grade, gameFile) {
        return {
            game_id: `mock_${grade}_${gameFile}`,
            title: `Grade ${grade} Game`,
            description: "Interactive learning game",
            grade: grade,
            subject: "General",
            difficulty: "medium",
            time_limit: 600,
            game_type: "quiz",
            odia_syllabus: true,
            instructions: "Complete the challenges to earn points",
            levels: [
                {
                    level: 1,
                    title: "Basic Level",
                    questions: [
                        {
                            question: "Sample question for Grade " + grade,
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correct: 0
                        }
                    ],
                    points: 20
                }
            ],
            scoring: {
                total_points: 100,
                passing_score: 60
            }
        };
    }
    
    // Get all subjects for a grade
    getSubjectsForGrade(grade) {
        if (!this.availableGames[grade]) {
            return [];
        }
        
        return Object.keys(this.availableGames[grade]).map(subject => ({
            id: subject.toLowerCase().replace(/\s+/g, '_'),
            name: subject,
            gameCount: this.availableGames[grade][subject].length
        }));
    }
    
    // Get game statistics
    getGameStats(grade, subject = null) {
        if (!this.availableGames[grade]) {
            return { totalGames: 0, subjects: 0 };
        }
        
        if (subject) {
            return {
                totalGames: this.availableGames[grade][subject]?.length || 0,
                subject: subject
            };
        }
        
        const subjects = Object.keys(this.availableGames[grade]);
        const totalGames = subjects.reduce((total, subj) => {
            return total + this.availableGames[grade][subj].length;
        }, 0);
        
        return {
            totalGames: totalGames,
            subjects: subjects.length,
            subjectList: subjects
        };
    }
    
    // Search games by keyword
    searchGames(grade, keyword) {
        if (!this.availableGames[grade]) {
            return [];
        }
        
        const results = [];
        const searchTerm = keyword.toLowerCase();
        
        Object.keys(this.availableGames[grade]).forEach(subject => {
            if (subject.toLowerCase().includes(searchTerm)) {
                this.availableGames[grade][subject].forEach(gameFile => {
                    results.push({
                        grade: grade,
                        subject: subject,
                        gameFile: gameFile,
                        path: `/games/grade_${grade}/${gameFile}`
                    });
                });
            }
        });
        
        return results;
    }
    
    // Get recommended games based on student performance
    getRecommendedGames(grade, studentData = {}) {
        const subjects = this.getSubjectsForGrade(grade);
        const recommendations = [];
        
        // Simple recommendation logic - can be enhanced with AI
        subjects.forEach(subject => {
            const games = this.getGamesForSubject(grade, subject.name);
            if (games.length > 0) {
                // Recommend first game of each subject
                recommendations.push({
                    ...games[0],
                    subject: subject.name,
                    reason: `Strengthen ${subject.name} skills`,
                    priority: Math.random() // Mock priority
                });
            }
        });
        
        // Sort by priority
        return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 6);
    }
    
    // Clear cache
    clearCache() {
        this.gameCache.clear();
        console.log('Game cache cleared');
    }
    
    // Get cache size
    getCacheSize() {
        return this.gameCache.size;
    }
}

// Initialize game loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameLoader = new GameLoader();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLoader;
}