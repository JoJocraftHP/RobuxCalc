document.addEventListener('DOMContentLoaded', () => {
    // ─── Constants ───
    const OLD_RATE_PER_100K = 350;
    const NEW_RATE_PER_100K = 380;
    const EUR_CONVERSION_RATE = 0.95;
    const TAX_RATE = 0.30;

    // ─── DOM: DevEx ───
    const amountInput = document.getElementById('amount-input');
    const currencyToggle = document.getElementById('currency-toggle'); // unchecked = EUR, checked = USD
    const rateToggle = document.getElementById('rate-toggle'); // unchecked = New, checked = Old
    const btnToCash = document.getElementById('btn-to-cash');
    const btnToRobux = document.getElementById('btn-to-robux');
    const inputLabel = document.getElementById('input-label');
    const inputSymbol = document.getElementById('input-symbol');
    const resultLabelText = document.getElementById('result-label-text');
    const resultDisplay = document.getElementById('result-display');
    const resultSubtext = document.getElementById('result-subtext');
    const rateInfoText = document.getElementById('rate-info-text');

    // ─── DOM: Tax ───
    const taxInput = document.getElementById('tax-input');
    const btnBeforeTax = document.getElementById('btn-before-tax');
    const btnAfterTax = document.getElementById('btn-after-tax');
    const taxInputLabel = document.getElementById('tax-input-label');
    const taxResultLabelText = document.getElementById('tax-result-label-text');
    const taxResultDisplay = document.getElementById('tax-result-display');
    const taxBaseDisplay = document.getElementById('tax-base-display');
    const taxAmountDisplay = document.getElementById('tax-amount-display');
    const taxLabel1 = document.getElementById('tax-label-1');
    const taxSep = document.getElementById('tax-sep');

    // ─── DOM: Shared ───
    const copiedToast = document.getElementById('copied-toast');
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    const tabDevex = document.getElementById('tab-devex');
    const tabTax = document.getElementById('tab-tax');
    const appTitle = document.getElementById('app-title');
    const appSubtitle = document.getElementById('app-subtitle');

    // ─── State ───
    let devexState = { mode: 'to-cash', amount: 0, currency: currencyToggle.checked ? 'USD' : 'EUR', rateType: rateToggle.checked ? 'new' : 'old' };
    let taxState = { mode: 'after-tax', amount: 0 };
    let activeTab = 'devex';

    // ─── Format Helpers ───
    const formatNumber = (num) => num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const formatRobux = (num) => `R$${formatNumber(Math.floor(num))}`;
    const formatCash = (num) => {
        const sym = devexState.currency === 'USD' ? '$' : '€';
        return `${sym}${formatNumber(num)}`;
    };

    // ─── Animated Counter Factory ───
    function createCounter(element) {
        let current = 0;
        let animId = null;

        return {
            animate(target, formatter) {
                if (animId) cancelAnimationFrame(animId);
                const start = current;
                const duration = 550;
                let startTime = null;

                function tick(ts) {
                    if (!startTime) startTime = ts;
                    const progress = Math.min((ts - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    current = start + (target - start) * eased;
                    element.textContent = formatter(current);
                    if (progress < 1) animId = requestAnimationFrame(tick);
                    else { current = target; animId = null; }
                }

                animId = requestAnimationFrame(tick);
            },
            reset(formatter) {
                if (animId) cancelAnimationFrame(animId);
                current = 0;
                animId = null;
                element.textContent = formatter(0);
            }
        };
    }

    const devexCounter = createCounter(resultDisplay);
    const taxMainCounter = createCounter(taxResultDisplay);

    // ─── Pop Animation ───
    function popResult(el) {
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
    }

    // ─── Copy to Clipboard ───
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            copiedToast.classList.add('show');
            setTimeout(() => copiedToast.classList.remove('show'), 1200);
        });
    }

    // ─── Tab Switching ───
    function switchTab(newTab) {
        if (activeTab === newTab) return;

        // Fade header out
        appTitle.style.opacity = '0';
        appTitle.style.transform = 'translateY(-4px)';
        appSubtitle.style.opacity = '0';

        // Switch views
        document.getElementById(`view-${activeTab}`).classList.remove('active');
        document.getElementById(`view-${newTab}`).classList.add('active');

        // Update tab buttons
        tabDevex.classList.toggle('active', newTab === 'devex');
        tabTax.classList.toggle('active', newTab === 'tax');

        // Fade header back in with new text
        setTimeout(() => {
            if (newTab === 'devex') {
                appTitle.textContent = 'DevEx Calculator';
                appSubtitle.textContent = 'Calculate your Robux earnings with the latest rates';
            } else {
                appTitle.textContent = 'Tax Calculator';
                appSubtitle.textContent = 'Figure out the true cost with marketplace tax';
            }
            appTitle.style.opacity = '1';
            appTitle.style.transform = 'translateY(0)';
            appSubtitle.style.opacity = '1';
        }, 140);

        activeTab = newTab;
    }

    // ═══════════════════════════════════════════
    // ─── DevEx Calculator ───
    // ═══════════════════════════════════════════

    function updateDevexUI() {
        if (devexState.mode === 'to-cash') {
            btnToCash.classList.add('active');
            btnToRobux.classList.remove('active');
            inputLabel.textContent = 'Robux Amount';
            inputSymbol.textContent = 'R$';
            resultSubtext.textContent = 'After Devex fees';
            resultLabelText.textContent = 'Estimated Earnings';
        } else {
            btnToCash.classList.remove('active');
            btnToRobux.classList.add('active');
            inputLabel.textContent = 'Cash Amount';
            inputSymbol.textContent = devexState.currency === 'USD' ? '$' : '€';
            resultLabelText.textContent = 'Robux Required';
            resultSubtext.textContent = 'To cash out this amount';
        }

        const rateBase = devexState.rateType === 'old' ? OLD_RATE_PER_100K : NEW_RATE_PER_100K;
        const sym = devexState.currency === 'USD' ? '$' : '€';
        let rate = rateBase;
        if (devexState.currency === 'EUR') rate *= EUR_CONVERSION_RATE;
        rateInfoText.textContent = `${sym}${rate.toFixed(0)} / 100k`;

        calculateDevex();
    }

    function calculateDevex() {
        const rateBase = devexState.rateType === 'old' ? OLD_RATE_PER_100K : NEW_RATE_PER_100K;
        let rate = rateBase;
        if (devexState.currency === 'EUR') rate *= EUR_CONVERSION_RATE;
        const ratePer1 = rate / 100000;

        if (devexState.mode === 'to-cash') {
            const result = devexState.amount * ratePer1;
            devexCounter.animate(result, formatCash);
        } else {
            const result = ratePer1 > 0 ? devexState.amount / ratePer1 : 0;
            devexCounter.animate(result, formatRobux);
        }

        if (devexState.amount > 0) {
            popResult(resultDisplay);
            resultDisplay.classList.add('counting');
            setTimeout(() => resultDisplay.classList.remove('counting'), 550);
        }
    }

    // Numbers-only filter for inputs
    function numbersOnly(e) {
        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    }
    amountInput.addEventListener('keydown', numbersOnly);
    taxInput.addEventListener('keydown', numbersOnly);

    // DevEx Input
    amountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        devexState.amount = parseFloat(value) || 0;
        calculateDevex();
    });

    amountInput.addEventListener('blur', () => {
        if (amountInput.value) amountInput.value = formatNumber(devexState.amount);
    });

    amountInput.addEventListener('focus', () => {
        if (devexState.amount) amountInput.value = devexState.amount;
        amountInput.select();
    });

    // DevEx Mode Buttons
    btnToCash.addEventListener('click', () => {
        if (devexState.mode === 'to-cash') return;
        devexState.mode = 'to-cash';
        devexState.amount = 0;
        amountInput.value = '';
        devexCounter.reset(formatCash);
        updateDevexUI();
    });

    btnToRobux.addEventListener('click', () => {
        if (devexState.mode === 'to-robux') return;
        devexState.mode = 'to-robux';
        devexState.amount = 0;
        amountInput.value = '';
        devexCounter.reset(formatRobux);
        updateDevexUI();
    });

    // DevEx Toggles
    currencyToggle.addEventListener('change', (e) => {
        devexState.currency = e.target.checked ? 'USD' : 'EUR';
        updateDevexUI();
    });

    rateToggle.addEventListener('change', (e) => {
        devexState.rateType = e.target.checked ? 'new' : 'old';
        updateDevexUI();
    });

    // ═══════════════════════════════════════════
    // ─── After Tax Calculator ───
    // ═══════════════════════════════════════════

    function updateTaxUI() {
        if (taxState.mode === 'after-tax') {
            btnAfterTax.classList.add('active');
            btnBeforeTax.classList.remove('active');
            taxInputLabel.textContent = 'Seller Wants';
            taxResultLabelText.textContent = 'You Need to Pay';
            taxLabel1.textContent = 'Seller Gets';
            taxSep.textContent = '+';
        } else {
            btnBeforeTax.classList.add('active');
            btnAfterTax.classList.remove('active');
            taxInputLabel.textContent = 'You Pay';
            taxResultLabelText.textContent = 'Seller Receives';
            taxLabel1.textContent = 'You Paid';
            taxSep.textContent = '−';
        }
        calculateTax();
    }

    function calculateTax() {
        const amount = taxState.amount;
        let resultAmount, breakdownBase, breakdownTax;

        if (taxState.mode === 'after-tax') {
            // Seller wants `amount` after tax → buyer pays amount / (1 - TAX_RATE)
            breakdownBase = amount;
            resultAmount = amount / (1 - TAX_RATE);
            breakdownTax = resultAmount - breakdownBase;
        } else {
            // You pay `amount` → seller gets amount * (1 - TAX_RATE)
            breakdownBase = amount;
            resultAmount = amount * (1 - TAX_RATE);
            breakdownTax = amount * TAX_RATE;
        }

        taxMainCounter.animate(resultAmount, formatRobux);
        taxBaseDisplay.textContent = formatRobux(breakdownBase);
        taxAmountDisplay.textContent = formatRobux(breakdownTax);

        if (amount > 0) {
            popResult(taxResultDisplay);
            taxResultDisplay.classList.add('counting');
            setTimeout(() => taxResultDisplay.classList.remove('counting'), 550);
        }
    }

    // Tax Input
    taxInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        taxState.amount = parseFloat(value) || 0;
        calculateTax();
    });

    taxInput.addEventListener('blur', () => {
        if (taxInput.value) taxInput.value = formatNumber(taxState.amount);
    });

    taxInput.addEventListener('focus', () => {
        if (taxState.amount) taxInput.value = taxState.amount;
        taxInput.select();
    });

    // Tax Mode Buttons
    btnBeforeTax.addEventListener('click', () => {
        if (taxState.mode === 'before-tax') return;
        taxState.mode = 'before-tax';
        taxState.amount = 0;
        taxInput.value = '';
        taxMainCounter.reset(formatRobux);
        taxBaseDisplay.textContent = 'R$0';
        taxAmountDisplay.textContent = 'R$0';
        updateTaxUI();
    });

    btnAfterTax.addEventListener('click', () => {
        if (taxState.mode === 'after-tax') return;
        taxState.mode = 'after-tax';
        taxState.amount = 0;
        taxInput.value = '';
        taxMainCounter.reset(formatRobux);
        taxBaseDisplay.textContent = 'R$0';
        taxAmountDisplay.textContent = 'R$0';
        updateTaxUI();
    });

    // ═══════════════════════════════════════════
    // ─── Tab Buttons ───
    // ═══════════════════════════════════════════
    tabDevex.addEventListener('click', () => switchTab('devex'));
    tabTax.addEventListener('click', () => switchTab('tax'));

    // ═══════════════════════════════════════════
    // ─── Copy to Clipboard ───
    // ═══════════════════════════════════════════
    document.getElementById('devex-result-section').addEventListener('click', () => {
        if (devexState.amount === 0) return;
        copyToClipboard(resultDisplay.textContent);
    });

    document.getElementById('tax-result-section').addEventListener('click', () => {
        if (taxState.amount === 0) return;
        copyToClipboard(taxResultDisplay.textContent);
    });

    // ═══════════════════════════════════════════
    // ─── Particle System ───
    // ═══════════════════════════════════════════
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
            this.fadeDir = 1;
            this.hue = Math.random() > 0.7 ? 150 : (Math.random() > 0.5 ? 210 : 260);
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.opacity += this.fadeSpeed * this.fadeDir;
            if (this.opacity >= 0.5) this.fadeDir = -1;
            if (this.opacity <= 0.05) this.fadeDir = 1;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        resizeCanvas();
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 30000);
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }

    setTimeout(() => {
        initParticles();
        animateParticles();
    }, 1000);

    window.addEventListener('resize', () => {
        resizeCanvas();
        particles.forEach(p => {
            if (p.x > canvas.width) p.x = canvas.width * Math.random();
            if (p.y > canvas.height) p.y = canvas.height * Math.random();
        });
    });

    // ─── Init ───
    updateDevexUI();
    updateTaxUI();
});
