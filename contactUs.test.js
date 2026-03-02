// Node.js test runner — no dependencies required
// Mirrors the tests in contactUs.test.html

// ── Minimal DOM mock ──────────────────────────────────────────────────────────
function makeElement(tag) {
    return {
        _value: '',
        get value() { return this._value; },
        set value(v) { this._value = v; },
        textContent: '',
        disabled: false,
        _listeners: {},
        addEventListener(event, fn) {
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(fn);
        },
        dispatchEvent(event) {
            (this._listeners[event.type] || []).forEach(fn => fn(event));
        }
    };
}

const elements = {
    firstName:      makeElement('input'),
    firstNameError: makeElement('span'),
    lastName:       makeElement('input'),
    lastNameError:  makeElement('span'),
    email:          makeElement('input'),
    emailError:     makeElement('span'),
    message:        makeElement('textarea'),
    messageError:   makeElement('span'),
    submitBtn:      makeElement('button'),
    contactForm:    makeElement('form'),
};
elements.submitBtn.disabled = true;

global.document = {
    getElementById: id => {
        const map = {
            firstName:      elements.firstName,
            firstNameError: elements.firstNameError,
            lastName:       elements.lastName,
            lastNameError:  elements.lastNameError,
            email:          elements.email,
            emailError:     elements.emailError,
            message:        elements.message,
            messageError:   elements.messageError,
            submitBtn:      elements.submitBtn,
            contactForm:    elements.contactForm,
        };
        return map[id] || null;
    }
};

// ── Validation logic (exact copy from contactUs.html) ────────────────────────
const namePattern  = /^[a-zA-Z']+$/;
const emailPattern = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9.]+$/;

const fields = {
    firstName: { el: document.getElementById('firstName'), err: document.getElementById('firstNameError'), valid: false },
    lastName:  { el: document.getElementById('lastName'),  err: document.getElementById('lastNameError'),  valid: false },
    email:     { el: document.getElementById('email'),     err: document.getElementById('emailError'),     valid: false },
    message:   { el: document.getElementById('message'),   err: document.getElementById('messageError'),   valid: false }
};
const submitBtn = document.getElementById('submitBtn');

function validate(key) {
    const { el, err } = fields[key];
    const val = el.value.trim();
    let msg = '';

    if (key === 'firstName' || key === 'lastName') {
        const label = key === 'firstName' ? 'First name' : 'Last name';
        if (!val) {
            msg = label + ' is required.';
        } else if (!namePattern.test(val)) {
            msg = label + ' may only contain letters and apostrophes.';
        }
    } else if (key === 'email') {
        if (!val) {
            msg = 'Email is required.';
        } else if (!emailPattern.test(val)) {
            msg = 'Please enter a valid email address.';
        }
    } else if (key === 'message') {
        if (!val) msg = 'Message is required.';
    }

    err.textContent = msg;
    fields[key].valid = msg === '';
    submitBtn.disabled = !Object.values(fields).every(f => f.valid);
}

// ── Test framework ────────────────────────────────────────────────────────────
const RESET = '\x1b[0m', GREEN = '\x1b[32m', RED = '\x1b[31m', BOLD = '\x1b[1m', DIM = '\x1b[2m';
let pass = 0, fail = 0;

function describe(name, fn) {
    console.log(`\n${BOLD}${name}${RESET}`);
    fn();
}

function it(desc, fn) {
    try {
        fn();
        console.log(`  ${GREEN}✓${RESET} ${DIM}${desc}${RESET}`);
        pass++;
    } catch(e) {
        console.log(`  ${RED}✗ ${desc}${RESET}`);
        console.log(`    ${RED}→ ${e.message}${RESET}`);
        fail++;
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected)
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        },
        toContain(substr) {
            if (!String(actual).includes(substr))
                throw new Error(`Expected "${actual}" to contain "${substr}"`);
        },
        toBeEmpty() {
            if (actual !== '')
                throw new Error(`Expected empty string, got "${actual}"`);
        }
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function set(key, value) {
    fields[key].el.value = value;
    validate(key);
}

function errorOf(key) { return fields[key].err.textContent; }

function resetAll() {
    Object.keys(fields).forEach(k => {
        fields[k].el.value = '';
        fields[k].valid = false;
        fields[k].err.textContent = '';
    });
    submitBtn.disabled = true;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Submit button — initial state', () => {
    it('is disabled before any input', () => {
        resetAll();
        expect(submitBtn.disabled).toBe(true);
    });
});

describe('First Name validation', () => {
    it('shows required error when empty', () => {
        resetAll(); set('firstName', '');
        expect(errorOf('firstName')).toContain('required');
    });
    it('accepts plain letters', () => {
        resetAll(); set('firstName', 'Jane');
        expect(errorOf('firstName')).toBeEmpty();
    });
    it("accepts a name with an apostrophe (O'Brien)", () => {
        resetAll(); set('firstName', "O'Brien");
        expect(errorOf('firstName')).toBeEmpty();
    });
    it('rejects numbers', () => {
        resetAll(); set('firstName', 'Jane2');
        expect(errorOf('firstName')).toContain('letters and apostrophes');
    });
    it('rejects special characters', () => {
        resetAll(); set('firstName', 'Jane!');
        expect(errorOf('firstName')).toContain('letters and apostrophes');
    });
    it('rejects spaces', () => {
        resetAll(); set('firstName', 'Jane Doe');
        expect(errorOf('firstName')).toContain('letters and apostrophes');
    });
});

describe('Last Name validation', () => {
    it('shows required error when empty', () => {
        resetAll(); set('lastName', '');
        expect(errorOf('lastName')).toContain('required');
    });
    it('accepts plain letters', () => {
        resetAll(); set('lastName', 'Smith');
        expect(errorOf('lastName')).toBeEmpty();
    });
    it("accepts a name with an apostrophe (O'Connor)", () => {
        resetAll(); set('lastName', "O'Connor");
        expect(errorOf('lastName')).toBeEmpty();
    });
    it('rejects numbers', () => {
        resetAll(); set('lastName', 'Smith3');
        expect(errorOf('lastName')).toContain('letters and apostrophes');
    });
    it('rejects special characters', () => {
        resetAll(); set('lastName', 'Smith#');
        expect(errorOf('lastName')).toContain('letters and apostrophes');
    });
});

describe('Email validation', () => {
    it('shows required error when empty', () => {
        resetAll(); set('email', '');
        expect(errorOf('email')).toContain('required');
    });
    it('accepts a standard email address', () => {
        resetAll(); set('email', 'user@example.com');
        expect(errorOf('email')).toBeEmpty();
    });
    it('accepts an email with dots and numbers', () => {
        resetAll(); set('email', 'jane.doe123@mail.domain.org');
        expect(errorOf('email')).toBeEmpty();
    });
    it('rejects an address missing @', () => {
        resetAll(); set('email', 'userexample.com');
        expect(errorOf('email')).toContain('valid email');
    });
    it('rejects an address missing a domain', () => {
        resetAll(); set('email', 'user@');
        expect(errorOf('email')).toContain('valid email');
    });
    it('rejects an address missing a TLD', () => {
        resetAll(); set('email', 'user@example');
        expect(errorOf('email')).toContain('valid email');
    });
    it('rejects an address with invalid characters (space)', () => {
        resetAll(); set('email', 'user name@example.com');
        expect(errorOf('email')).toContain('valid email');
    });
});

describe('Message validation', () => {
    it('shows required error when empty', () => {
        resetAll(); set('message', '');
        expect(errorOf('message')).toContain('required');
    });
    it('clears the error when text is entered', () => {
        resetAll(); set('message', 'Hello there!');
        expect(errorOf('message')).toBeEmpty();
    });
    it('treats whitespace-only as empty', () => {
        resetAll(); set('message', '   ');
        expect(errorOf('message')).toContain('required');
    });
});

describe('Submit button — enabled only when all fields valid', () => {
    it('remains disabled when only first name is filled', () => {
        resetAll(); set('firstName', 'Jane');
        expect(submitBtn.disabled).toBe(true);
    });
    it('remains disabled when three of four fields are valid', () => {
        resetAll();
        set('firstName', 'Jane'); set('lastName', 'Doe'); set('email', 'jane@example.com');
        expect(submitBtn.disabled).toBe(true);
    });
    it('becomes enabled when all four fields are valid', () => {
        resetAll();
        set('firstName', 'Jane'); set('lastName', 'Doe');
        set('email', 'jane@example.com'); set('message', 'Hello!');
        expect(submitBtn.disabled).toBe(false);
    });
    it('disables again when a valid field is cleared', () => {
        resetAll();
        set('firstName', 'Jane'); set('lastName', 'Doe');
        set('email', 'jane@example.com'); set('message', 'Hello!');
        set('email', '');
        expect(submitBtn.disabled).toBe(true);
    });
    it('disables again when a field becomes invalid', () => {
        resetAll();
        set('firstName', 'Jane'); set('lastName', 'Doe');
        set('email', 'jane@example.com'); set('message', 'Hello!');
        set('firstName', 'Jane123');
        expect(submitBtn.disabled).toBe(true);
    });
});

// ── Summary ───────────────────────────────────────────────────────────────────
const total = pass + fail;
console.log(`\n${BOLD}${'─'.repeat(40)}${RESET}`);
if (fail === 0) {
    console.log(`${GREEN}${BOLD}All ${total} tests passed${RESET}`);
} else {
    console.log(`${RED}${BOLD}${fail} of ${total} tests failed${RESET}`);
}
console.log();
process.exit(fail > 0 ? 1 : 0);
