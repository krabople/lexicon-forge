/**
 * Level Manager for Lexicon Forge (Journey & Blitz Modes)
 */
class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.maxUnlockedLevel = parseInt(localStorage.getItem('lf_unlocked_level') || '1', 10);
        this.campaignLevels = this.generateCampaignLevels();
    }

    generateCampaignLevels() {
        const levels = [];
        const letterPools = [
            ["A","E","I","O","U","S","T","R","N","L","C","P","M","D"],
            ["E","A","O","T","N","S","L","C","D","P","M","H","G","B","F"],
            ["E","A","I","O","U","S","T","R","N","L","C","P","D","M","G","H","B","F","K","W","Y","V","X","Z","Q"]
        ];

        for (let i = 1; i <= 30; i++) {
            const targetWords = 2 + Math.floor(i / 3);
            const minLength = 3 + (i > 10 ? 1 : 0);
            const poolIdx = Math.min(2, Math.floor((i - 1) / 10));

            levels.push({
                id: i,
                title: `SECTOR ${i}`,
                objectiveText: `FORGE ${targetWords} WORDS OF ${minLength}+ LETTERS`,
                targetWords,
                minLength,
                orbCount: 16 + Math.min(8, Math.floor(i / 2)),
                timeLimit: 90 + i * 5,
                letterPool: letterPools[poolIdx]
            });
        }
        return levels;
    }

    loadLevel(levelIndex, width, height) {
        this.currentLevelIndex = levelIndex;
        const config = this.campaignLevels[levelIndex] || this.campaignLevels[0];

        const orbs = [];
        const padding = 60;
        
        for (let i = 0; i < config.orbCount; i++) {
            const letter = config.letterPool[Math.floor(Math.random() * config.letterPool.length)];
            const x = padding + Math.random() * (width - padding * 2);
            const y = 140 + Math.random() * (height - 240);
            
            orbs.push(new LetterOrb(i, letter, x, y, 26));
        }

        return {
            config,
            orbs
        };
    }

    generateBlitzMode(width, height) {
        const letterPool = ["E","A","I","O","U","S","T","R","N","L","C","P","D","M","G","H","B","F","K","W","Y","V","X","Z","Q"];
        const orbs = [];
        const padding = 60;

        for (let i = 0; i < 24; i++) {
            const letter = letterPool[Math.floor(Math.random() * letterPool.length)];
            const x = padding + Math.random() * (width - padding * 2);
            const y = 140 + Math.random() * (height - 240);
            orbs.push(new LetterOrb(i, letter, x, y, 26));
        }

        return {
            config: {
                title: "BLITZ MODE",
                objectiveText: "FORGE WORDS FAST TO SURVIVE 60s",
                timeLimit: 60
            },
            orbs
        };
    }

    unlockLevel(levelNum) {
        if (levelNum > this.maxUnlockedLevel) {
            this.maxUnlockedLevel = levelNum;
            localStorage.setItem('lf_unlocked_level', levelNum.toString());
        }
    }
}
