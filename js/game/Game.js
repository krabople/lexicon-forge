/**
 * Main Game Controller for Lexicon Forge
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;

        // Engines & Controllers
        this.particleSystem = new ParticleSystem();
        this.sound = new SoundSynth();
        this.dictionary = new Dictionary();
        this.wordWeaver = new WordWeaver(this.dictionary, this.particleSystem, this.sound);
        this.levelMgr = new LevelManager();

        // Game State
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, VICTORY, GAMEOVER
        this.mode = 'CAMPAIGN'; // CAMPAIGN, BLITZ
        this.score = 0;
        this.timeRemaining = 60;
        this.orbs = [];
        this.currentLevelConfig = null;
        this.forgedWordsCount = 0;

        // Swiping State
        this.isSwiping = false;
        this.pointerPos = new Vector2(0, 0);

        // Background star/ember particle field
        this.embers = [];
        this.initEmbers();

        this.lastTime = performance.now();
        this.resize();
        this.bindEvents();
    }

    initEmbers() {
        this.embers = [];
        for (let i = 0; i < 80; i++) {
            this.embers.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.6 + 0.2,
                speed: Math.random() * 20 + 5
            });
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Pointer Events for Swiping Chain
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.state !== 'PLAYING') return;
            this.isSwiping = true;
            this.pointerPos.set(e.clientX, e.clientY);
            this.checkOrbSelection(this.pointerPos);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isSwiping || this.state !== 'PLAYING') return;
            this.pointerPos.set(e.clientX, e.clientY);
            this.checkOrbSelection(this.pointerPos);
        });

        const endSwipe = () => {
            this.isSwiping = false;
        };

        this.canvas.addEventListener('pointerup', endSwipe);
        this.canvas.addEventListener('pointercancel', endSwipe);
    }

    checkOrbSelection(pos) {
        for (const orb of this.orbs) {
            if (Physics.pointInCircle(pos, orb.pos, orb.radius * 1.2)) {
                if (this.wordWeaver.trySelectOrb(orb)) {
                    this.updateHUD();
                }
                break;
            }
        }
    }

    startCampaignLevel(levelIdx = 0) {
        this.mode = 'CAMPAIGN';
        const data = this.levelMgr.loadLevel(levelIdx, this.width, this.height);
        this.setupEntities(data);
    }

    startBlitzMode() {
        this.mode = 'BLITZ';
        const data = this.levelMgr.generateBlitzMode(this.width, this.height);
        this.setupEntities(data);
    }

    setupEntities(data) {
        this.currentLevelConfig = data.config;
        this.orbs = data.orbs;
        this.score = 0;
        this.forgedWordsCount = 0;
        this.timeRemaining = data.config.timeLimit || 60;

        this.wordWeaver.clearSelection();
        this.wordWeaver.streak = 1.0;
        this.wordWeaver.totalWordsForged = 0;
        this.wordWeaver.bestWord = "";

        this.particleSystem.clear();
        this.state = 'PLAYING';
        this.updateHUD();
    }

    submitCurrentWord() {
        if (this.state !== 'PLAYING') return;
        const result = this.wordWeaver.submitWord(this.orbs);

        if (result && result.valid) {
            this.score += result.score;
            this.forgedWordsCount++;

            // Replace forged orbs with new letters
            const vowels = ["A","E","I","O","U"];
            const consonants = ["S","T","R","N","L","C","P","D","M","G","H","B","F","K","W","Y","V","X","Z","Q"];
            
            for (let i = 0; i < this.orbs.length; i++) {
                if (result.forgedOrbs.has(this.orbs[i])) {
                    const isVowel = Math.random() < 0.4;
                    const pool = isVowel ? vowels : consonants;
                    const newLetter = pool[Math.floor(Math.random() * pool.length)];

                    const padding = 60;
                    const x = padding + Math.random() * (this.width - padding * 2);
                    const y = 140 + Math.random() * (this.height - 240);

                    this.orbs[i] = new LetterOrb(i, newLetter, x, y, 26);
                }
            }

            // Check Win Condition for Campaign Mode
            if (this.mode === 'CAMPAIGN' && this.forgedWordsCount >= this.currentLevelConfig.targetWords) {
                this.triggerVictory();
            }
        }

        this.updateHUD();
    }

    clearCurrentWord() {
        this.wordWeaver.clearSelection();
        this.updateHUD();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pauseModal').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pauseModal').classList.add('hidden');
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Timer decrement
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.triggerGameOver('Time expired!');
            return;
        }

        // Update Embers background
        for (const ember of this.embers) {
            ember.y -= ember.speed * dt;
            if (ember.y < 0) ember.y = this.height;
        }

        // Update Orbs & Resolve Collisions
        for (let i = 0; i < this.orbs.length; i++) {
            this.orbs[i].update(dt, { width: this.width, height: this.height });
            for (let j = i + 1; j < this.orbs.length; j++) {
                Physics.resolveOrbCollision(this.orbs[i], this.orbs[j]);
            }
        }

        // Update Particles
        this.particleSystem.update(dt);
        this.updateHUD();
    }

    triggerVictory() {
        this.state = 'VICTORY';
        this.sound.playVictorySFX();
        this.levelMgr.unlockLevel(this.levelMgr.currentLevelIndex + 2);

        document.getElementById('levelScoreVal').innerText = this.score;
        document.getElementById('levelWordsVal').innerText = this.forgedWordsCount;
        document.getElementById('levelBestWordVal').innerText = this.wordWeaver.bestWord || '-';
        document.getElementById('levelCompleteModal').classList.remove('hidden');
    }

    triggerGameOver(reason) {
        this.state = 'GAMEOVER';
        document.getElementById('defeatReasonText').innerText = reason;
        document.getElementById('finalScoreVal').innerText = this.score;
        document.getElementById('finalWordsVal').innerText = this.forgedWordsCount;
        document.getElementById('gameOverModal').classList.remove('hidden');

        const currentHigh = parseInt(localStorage.getItem('lf_high_score') || '0', 10);
        if (this.score > currentHigh) {
            localStorage.setItem('lf_high_score', this.score.toString());
            document.getElementById('menuHighScore').innerText = this.score;
        }
    }

    updateHUD() {
        document.getElementById('scoreText').innerText = this.score;
        document.getElementById('streakText').innerText = `x${this.wordWeaver.streak.toFixed(1)}`;
        document.getElementById('timerText').innerText = `${Math.ceil(this.timeRemaining)}s`;
        document.getElementById('wordsCountText').innerText = this.forgedWordsCount;

        const currentWord = this.wordWeaver.currentWord;
        document.getElementById('currentWordText').innerText = currentWord.length > 0 ? currentWord : "SWIPE LETTERS";
        document.getElementById('wordScoreBonus').innerText = currentWord.length >= 2 ? `+${currentWord.length * 100}` : "+0";

        const submitBtn = document.getElementById('submitWordBtn');
        if (currentWord.length >= 2) {
            submitBtn.classList.remove('disabled');
        } else {
            submitBtn.classList.add('disabled');
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Ambient Ember Background
        this.ctx.fillStyle = '#ffaa00';
        for (const ember of this.embers) {
            this.ctx.globalAlpha = ember.alpha;
            this.ctx.fillRect(ember.x, ember.y, ember.size, ember.size);
        }
        this.ctx.globalAlpha = 1;

        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            // Draw Swipe Connection Lines
            const selected = this.wordWeaver.selectedOrbs;
            if (selected.length > 1) {
                this.ctx.save();
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.shadowColor = '#00f0ff';
                this.ctx.shadowBlur = 15;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(selected[0].pos.x, selected[0].pos.y);
                for (let i = 1; i < selected.length; i++) {
                    this.ctx.lineTo(selected[i].pos.x, selected[i].pos.y);
                }
                if (this.isSwiping) {
                    this.ctx.lineTo(this.pointerPos.x, this.pointerPos.y);
                }
                this.ctx.stroke();
                this.ctx.restore();
            }

            // Draw Orbs
            for (const orb of this.orbs) orb.draw(this.ctx);

            // Draw Particles
            this.particleSystem.draw(this.ctx);
        }
    }

    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
