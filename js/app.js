/**
 * 🚀 MAIN APPLICATION CONTROLLER
 * يربط البيانات، المنطق، العرض، والصوت معاً
 * نقطة الدخول الرئيسية للتطبيق
 */

import { GameLevels } from './data.js';
import { GameLogic } from './logic.js';
import { UI } from './ui.js';
import { AudioSys } from './audio.js';

const App = {
    // حالة التطبيق المحلية (لإدارة التفاعل فقط)
    state: {
        currentMode: null,  // 'clash', 'code', ...
        pendingMove: null,  // { g, c } الحركة المعلقة بانتظار الحل
        currentQuestion: null,
        calcBuffer: [],     // ما يكتبه المستخدم في الحاسبة
        configPin: '0000'   // سيتم جلبه من config.json
    },

    // 1. نقطة البداية
    async init() {
        // تحميل الإعدادات
        try {
            const res = await fetch('config.json');
            const conf = await res.json();
            this.state.configPin = conf.access_pin;
        } catch (e) { console.warn('Config load failed, using default'); }

        // تهيئة الصوت (تتطلب تفاعل مستخدم لاحقاً)
        document.body.addEventListener('click', () => AudioSys.init(), { once: true });

        this.bindEvents();
    },

    // 2. ربط الأحداث (Event Listeners)
    bindEvents() {
        // --- شاشة الدخول ---
        document.getElementById('btn-login').addEventListener('click', () => {
            const pin = document.getElementById('pin-input').value;
            if (pin === this.state.configPin) {
                AudioSys.click();
                UI.showScreen('screen-setup');
            } else {
                AudioSys.error();
                document.getElementById('login-msg').textContent = 'الرمز غير صحيح';
                document.getElementById('pin-input').value = '';
            }
        });

        // --- شاشة الإعدادات ---
        // اختيار الأفاتار
        ['p1', 'p2'].forEach(pid => {
            document.getElementById(`${pid}-avatars`).addEventListener('click', (e) => {
                if (e.target.classList.contains('av-item')) {
                    AudioSys.click();
                    const val = e.target.dataset.val;
                    UI.updateAvatarSelection(pid, val);
                    // تخزين مؤقت في المنطق (سنحفظه فعلياً عند الانطلاق)
                    GameLogic.state[pid].tempAvatar = val;
                }
            });
        });

        document.getElementById('btn-save-setup').addEventListener('click', () => {
            AudioSys.click();
            // حفظ الأسماء والأفاتار
            const p1Name = document.getElementById('p1-name').value || 'اللاعب 1';
            const p2Name = document.getElementById('p2-name').value || 'اللاعب 2';
            
            GameLogic.state.p1.name = p1Name;
            GameLogic.state.p2.name = p2Name;
            // الأفاتار مخزن مسبقاً في DOM عبر الكلاس selected، نجلبهم
            GameLogic.state.p1.avatar = document.querySelector('#p1-avatars .selected').dataset.val;
            GameLogic.state.p2.avatar = document.querySelector('#p2-avatars .selected').dataset.val;

            UI.showScreen('screen-menu');
        });

        // --- القائمة الرئيسية (اختيار النمط) ---
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                AudioSys.power(); // صوت حماسي
                const mode = card.dataset.mode;
                this.startGame(mode);
            });
        });

        document.getElementById('btn-back-settings').addEventListener('click', () => {
            AudioSys.click();
            UI.showScreen('screen-setup');
        });

        // --- ساحة اللعب ---
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            if (confirm('هل تود الخروج من المباراة؟')) {
                UI.showScreen('screen-menu');
            }
        });

        // أزرار القوى
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const powerType = btn.dataset.power;
                this.handlePowerClick(powerType, btn);
            });
        });

        // النوافذ
        document.getElementById('btn-help-game').addEventListener('click', () => UI.openModal('modal-help'));
        document.getElementById('btn-help-setup').addEventListener('click', () => UI.openModal('modal-help'));
        document.querySelector('.btn-close-modal').addEventListener('click', () => UI.closeModal('modal-help'));
        
        document.getElementById('btn-rematch').addEventListener('click', () => {
            UI.closeModal('modal-win');
            this.startGame(this.state.currentMode);
        });
        document.getElementById('btn-home').addEventListener('click', () => {
            UI.closeModal('modal-win');
            UI.showScreen('screen-menu');
        });

        // --- الحاسبة (Numpad) ---
        const numpad = document.querySelector('.numpad-grid');
        numpad.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const key = e.target.dataset.key;
                this.handleCalcInput(key);
            }
        });
    },

    // 3. بدء اللعبة
    startGame(mode) {
        this.state.currentMode = mode;
        GameLogic.init(); // تصفير المنطق
        
        // بناء الرقعة وتمرير دالة النقر
        UI.createGrid((g, c) => this.handleGridClick(g, c));
        
        // تحديث الواجهة لأول مرة
        UI.updateGrid(GameLogic.state);
        UI.updateHUD(GameLogic.state);
        
        UI.showScreen('screen-game');
    },

    // 4. التعامل مع النقر على الشبكة
    handleGridClick(g, c) {
        // إذا كان هناك قوة مفعلة (مثل التدمير)، نعالجها هنا
        if (this.state.activePower) {
            this.executePower(this.state.activePower, g, c);
            return;
        }

        // 1. التحقق من صلاحية الحركة
        if (!GameLogic.isValidMove(g, c)) {
            AudioSys.error();
            // يمكن إضافة اهتزاز للخلية هنا
            return;
        }

        // 2. تجهيز السؤال الرياضي
        this.state.pendingMove = { g, c };
        const levelData = GameLevels[this.state.currentMode];
        
        // اختيار سؤال عشوائي
        // في وضع "الميزان"، نطبق خوارزمية 90/10
        let question;
        if (this.state.currentMode === 'balance') {
            const isHard = Math.random() < 0.9;
            const pool = isHard ? levelData.hard : levelData.easy;
            question = pool[Math.floor(Math.random() * pool.length)];
        } else {
            question = levelData.pool[Math.floor(Math.random() * levelData.pool.length)];
        }

        this.state.currentQuestion = question;
        this.state.calcBuffer = []; // تصفير المخزن

        // 3. فتح الحاسبة
        AudioSys.click();
        UI.setupCalculator(question, this.state.currentMode);
        UI.openModal('modal-calc');
    },

    // 5. التعامل مع إدخال الحاسبة
    handleCalcInput(key) {
        const mode = this.state.currentMode;
        const buffer = this.state.calcBuffer;
        
        // تحديد الحد الأقصى للخانات
        const maxSlots = mode === 'duality' ? 2 : 1;
        
        if (key === 'del') {
            AudioSys.click();
            buffer.pop(); // حذف آخر مدخل
        } else if (key === 'ok') {
            this.verifyAnswer();
        } else {
            // إدخال رقم
            if (buffer.length < maxSlots) {
                // في وضع الثنائيات، الرقم الواحد قد يتكون من عدة خانات؟ 
                // لتبسيط اللعبة، سنفترض أن الإجابات رقم واحد (0-9) أو ندمج الأرقام
                // هنا سنفترض أن المستخدم يكتب الرقم كاملاً ثم ينتقل تلقائياً؟
                // للتبسيط: كل خانة تأخذ رقماً واحداً أو عدة أرقام؟
                // سنجعلها بسيطة: زر الأرقام يضيف للخانة الحالية.
                
                // التعديل: بما أن الأجوبة قد تكون > 9 (مثل 12)، نحتاج للكتابة في الخانة النشطة
                // سنستخدم منطق: إذا كانت الخانة الأولى ممتلئة، هل ننتقل؟
                
                // الحل الأبسط: buffer يخزن أرقاماً كاملة كـ Strings
                // نحدد الخانة النشطة بناء على طول المصفوفة
                
                const activeIndex = buffer.length; // الخانة الحالية (0 أو 1)
                
                // ولكن لحظة، كيف نكتب "12"؟
                // سنعتبر أن الزر يضيف نصاً للخانة الحالية، وزر OK ينتقل للتالية أو يعتمد
                
                // تعديل المنطق ليدعم أرقام متعددة الخانات (مثل 12):
                // buffer سيكون مصفوفة نصوص ['12', '5']
                
                // إذا لم تكن هناك خانة، ننشئها
                if (buffer.length === 0) buffer.push('');
                
                // نأخذ آخر قيمة ونضيف لها الرقم
                let currentVal = buffer[buffer.length - 1];
                
                // هل نحتاج لفتح خانة جديدة؟ (فقط في وضع الثنائيات وبزر خاص؟)
                // الأفضل: في وضع الثنائيات، زر OK ينقلك للخانة التالية
                
                AudioSys.type();
                buffer[buffer.length - 1] = currentVal + key;
            }
        }
        
        // في وضع الثنائيات، نحتاج لمعرفة الخانة النشطة
        // سنفترض أن المستخدم يضغط OK للانتقال للخانة الثانية
        
        UI.updateCalcInput(buffer, buffer.length - 1);
    },

    verifyAnswer() {
        const mode = this.state.currentMode;
        const buffer = this.state.calcBuffer;
        const question = this.state.currentQuestion;
        
        // في وضع الثنائيات، نحتاج لرقمين. زر OK يعمل كـ (Next) ثم (Submit)
        if (mode === 'duality') {
            if (buffer.length < 2) {
                // الانتقال للخانة الثانية
                if (buffer[0] && buffer[0] !== '') {
                    AudioSys.click();
                    buffer.push(''); // فتح خانة جديدة
                    UI.updateCalcInput(buffer, 1);
                    return;
                }
            }
        }

        // التحقق النهائي
        // تحويل المدخلات لأرقام
        const inputs = buffer.map(s => parseInt(s));
        
        // التحقق من صحة الأرقام (NaN)
        if (inputs.some(isNaN)) {
            AudioSys.error();
            UI.shakeCalculator();
            return;
        }

        let isCorrect = false;

        if (mode === 'duality') {
            // التحقق من الأزواج
            const v1 = inputs[0], v2 = inputs[1];
            isCorrect = question.p.some(pair => 
                (pair[0] === v1 && pair[1] === v2) || (pair[0] === v2 && pair[1] === v1)
            );
        } else {
            // الأوضاع الأخرى (رقم واحد)
            isCorrect = inputs[0] === question.a;
        }

        if (isCorrect) {
            AudioSys.correct();
            UI.closeModal('modal-calc');
            
            // تنفيذ الحركة
            const { g, c } = this.state.pendingMove;
            const result = GameLogic.makeMove(g, c);
            
            // تحديث الشاشة
            UI.updateGrid(GameLogic.state);
            UI.updateHUD(GameLogic.state);
            
            // هل انتهت اللعبة؟
            if (result === 'GAME_OVER') {
                AudioSys.win();
                const winnerSymbol = GameLogic.state.winner;
                const winnerName = winnerSymbol === 'X' ? GameLogic.state.p1.name : GameLogic.state.p2.name;
                UI.showWinScreen(winnerName);
            }

        } else {
            AudioSys.error();
            UI.shakeCalculator();
            // تصفير المدخلات للمحاولة مجدداً
            this.state.calcBuffer = mode === 'duality' ? [''] : [''];
            setTimeout(() => UI.updateCalcInput(this.state.calcBuffer, 0), 400);
        }
    },

    // 6. التعامل مع القدرات الخاصة
    handlePowerClick(type, btn) {
        if (btn.style.opacity === '0.3') return; // غير متاح
        
        AudioSys.click();

        // إذا ضغط نفس الزر، يلغي التفعيل
        if (this.state.activePower === type) {
            this.state.activePower = null;
            btn.classList.remove('active');
            UI.updateStatus('تم إلغاء القدرة');
            return;
        }

        // تفعيل القدرة
        this.state.activePower = type;
        
        // إزالة التفعيل من الأزرار الأخرى
        document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // رسائل توجيهية
        if (type === 'nuke') UI.updateStatus('☢️ اختر مربعاً لتدميره!');
        if (type === 'freeze') {
            // التجميد فوري ولا يحتاج لاختيار مربع
            if (GameLogic.useFreeze()) {
                AudioSys.power();
                UI.updateStatus('❄️ تم تجميد الخصم! العب مجدداً');
                UI.updateHUD(GameLogic.state); // لتحديث العدادات والدور
                this.state.activePower = null; // إنهاء التفعيل
                btn.classList.remove('active');
            }
        }
        if (type === 'hack') UI.updateStatus('👾 اختر خلية للخصم لسرقتها!');
    },

    executePower(type, g, c) {
        let success = false;

        if (type === 'nuke') {
            // النقر يكون على المربع الكبير (أي خلية داخله تكفي لتحديد المربع)
            success = GameLogic.useNuke(g);
        } else if (type === 'hack') {
            success = GameLogic.useHack(g, c);
        }

        if (success) {
            AudioSys.power();
            UI.updateGrid(GameLogic.state);
            UI.updateHUD(GameLogic.state);
            
            // إلغاء وضع التفعيل
            this.state.activePower = null;
            document.querySelectorAll('.power-btn').forEach(b => b.classList.remove('active'));
            UI.updateStatus('تم تنفيذ القدرة بنجاح!');
        } else {
            AudioSys.error();
            UI.updateStatus('❌ حركة غير صالحة للقدرة');
        }
    }
};

// تشغيل التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
