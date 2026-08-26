/**
 * Word Weaver & Swiping Chain Logic
 */
class WordWeaver {
    constructor(dictionary, particleSystem, soundSynth) {
        this.dict = dictionary;
        this.particles = particleSystem;
        this.sound = soundSynth;

        this.selectedOrbs = [];
        this.currentWord = "";
        this.streak = 1.0;
        this.totalWordsForged = 0;
        this.bestWord = "";
    }

    /**
     * Try adding an orb to current swipe selection chain
     */
    trySelectOrb(orb) {
        if (!orb) return false;

        // If already selected, check if backtracking to previous orb
        const existingIdx = this.selectedOrbs.indexOf(orb);
        if (existingIdx >= 0) {
            if (existingIdx === this.selectedOrbs.length - 2) {
                // Backtrack 1 step
                const removed = this.selectedOrbs.pop();
                removed.selected = false;
                removed.selectedIndex = -1;
                this.updateWordString();
                return true;
            }
            return false;
        }

        // Must be within proximity of last selected orb (if chain started)
        if (this.selectedOrbs.length > 0) {
            const lastOrb = this.selectedOrbs[this.selectedOrbs.length - 1];
            const maxDist = (lastOrb.radius + orb.radius) * 2.5;
            if (lastOrb.pos.dist(orb.pos) > maxDist) {
                return false;
            }
        }

        // Add to selection chain
        orb.selected = true;
        orb.selectedIndex = this.selectedOrbs.length;
        this.selectedOrbs.push(orb);
        
        this.sound.playTileSelectNote(this.selectedOrbs.length);
        this.particles.emitShatterBurst(orb.pos.x, orb.pos.y, 6);
        this.updateWordString();
        return true;
    }

    updateWordString() {
        this.currentWord = this.selectedOrbs.map(o => o.letter).join('');
    }

    clearSelection() {
        for (const orb of this.selectedOrbs) {
            orb.selected = false;
            orb.selectedIndex = -1;
        }
        this.selectedOrbs = [];
        this.currentWord = "";
    }

    /**
     * Submit current selected word
     */
    submitWord(orbsList) {
        if (this.currentWord.length < 2) return null;

        const isValid = this.dict.isValidWord(this.currentWord);
        if (!isValid) {
            this.clearSelection();
            return { valid: false, reason: "NOT IN DICTIONARY" };
        }

        // Calculate Score & Multipliers
        const baseScore = this.currentWord.length * 100;
        const streakBonus = Math.floor(baseScore * (this.streak - 1.0));
        const totalScore = Math.floor((baseScore + streakBonus) * this.streak);

        // Check if ending letter matches next pivot
        const lastLetter = this.currentWord[this.currentWord.length - 1];

        // Trigger Elemental Burst FX
        let elementalType = 'STANDARD';
        if (this.currentWord.length >= 5) elementalType = 'IGNITE';

        for (const orb of this.selectedOrbs) {
            if (elementalType === 'IGNITE') {
                this.particles.emitIgniteBurst(orb.pos.x, orb.pos.y, 15);
            } else if (orb.element === 'SHATTER') {
                this.particles.emitShatterBurst(orb.pos.x, orb.pos.y, 15);
            } else {
                this.particles.emitTeslaBurst(orb.pos.x, orb.pos.y, 12);
            }
        }

        this.sound.playWordForgeSFX(this.currentWord.length);
        this.totalWordsForged++;

        if (this.currentWord.length > this.bestWord.length) {
            this.bestWord = this.currentWord;
        }

        // Remove forged orbs from active board
        const forgedSet = new Set(this.selectedOrbs);
        this.selectedOrbs = [];
        this.currentWord = "";

        // Update streak multiplier
        this.streak = Math.min(5.0, this.streak + 0.3);

        return {
            valid: true,
            score: totalScore,
            word: this.currentWord,
            forgedOrbs: forgedSet,
            lastLetter
        };
    }
}
