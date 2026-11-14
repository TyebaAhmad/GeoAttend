/*
 * GeoAttend — shared DEMO data for the admin pages (courses, teachers, students, geofences)
 *
 * There is no backend yet, so every admin page reads and writes the same browser localStorage keys
 * through these helpers. That keeps the pages consistent with each other:
 *   - a course created on Courses shows up in Teachers and Students
 *   - a teacher assigned on Courses shows up on Teachers (and the other way round)
 *
 * Later each load…/save… function becomes a call to the backend API.
 *
 *   GA.loadCourses()  / GA.saveCourses(list)     key "ga_courses"
 *   GA.loadTeachers() / GA.saveTeachers(list)    key "ga_teachers"
 *   GA.loadStudents() / GA.saveStudents(list)    key "ga_students"
 *   GA.loadZones()    / GA.saveZones(list)       key "ga_geofences"
 *   GA.liveCodes()                               courses with an attendance session running now
 */
(function () {
    /* ---------- Seeded random: same input → same sample data ---------- */
    function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
    function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    function read(key) { try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : null; } catch { return null; } }
    function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; } }
    function settings() { try { return JSON.parse(localStorage.getItem('ga_settings')) || {}; } catch { return {}; } }

    /* ---------- Departments ---------- */
    const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Information Technology', 'Electrical Engineering', 'Mathematics'];
    // degree codes used in student roll numbers (FA22-BCS-001)
    const DEPT_CODES = { 'Computer Science': 'BCS', 'Software Engineering': 'BSE', 'Artificial Intelligence': 'BAI', 'Information Technology': 'BIT', 'Electrical Engineering': 'BEE' };
    // default enrolment for sample students of each degree
    const DEPT_COURSES = {
        'Computer Science': ['CS301', 'CS205', 'CS110'],
        'Software Engineering': ['SE210', 'SE315', 'CS205'],
        'Artificial Intelligence': ['AI402', 'AI310', 'CS205'],
        'Information Technology': ['IT220', 'IT150', 'CS110'],
        'Electrical Engineering': ['EE110', 'EE230']
    };
    const SHARED = ['MT105'];   // taken by every degree

    /* ---------- Courses (the catalogue every page uses) ---------- */
    function sampleCourses() {
        // days: 1 = Mon … 5 = Fri · time: start "HH:MM" · dur: minutes · zone: geofence id
        const c = (code, name, dept, cr, sem, capacity, days, time, room, zone, desc) =>
            ({ code, name, dept, cr, sem, capacity, days, time, dur: 90, room, zone, status: 'active', desc });
        return [
            c('CS301', 'Database Systems', 'Computer Science', 3, 5, 60, [1, 3], '09:00', 'Room B-204', 'z2', 'Relational model, SQL, normalisation, transactions and indexing.'),
            c('CS205', 'Data Structures', 'Computer Science', 3, 3, 60, [2, 4], '10:30', 'Room B-110', 'z1', 'Lists, stacks, queues, trees, graphs, hashing and algorithm analysis.'),
            c('CS110', 'Programming Fundamentals', 'Computer Science', 4, 1, 70, [1, 4], '12:00', 'Lab 2', 'z1', 'Problem solving and programming basics in Python.'),
            c('SE210', 'Software Engineering', 'Software Engineering', 3, 4, 55, [1, 4], '11:00', 'Lab 3', 'z3', 'Requirements, design, testing and agile project management.'),
            c('SE315', 'Web Engineering', 'Software Engineering', 3, 5, 50, [2, 5], '09:00', 'Lab 1', 'z1', 'Front-end and back-end web development, REST APIs and deployment.'),
            c('AI402', 'Artificial Intelligence', 'Artificial Intelligence', 3, 7, 60, [3, 5], '10:00', 'Hall A', 'z4', 'Search, knowledge representation, planning and intelligent agents.'),
            c('AI310', 'Machine Learning', 'Artificial Intelligence', 3, 5, 55, [1, 2], '14:00', 'Hall A', 'z4', 'Supervised and unsupervised learning, evaluation and neural networks.'),
            c('IT220', 'Computer Networks', 'Information Technology', 3, 4, 45, [2, 4], '12:00', 'Room C-201', 'z1', 'Network layers, TCP/IP, routing, switching and network security basics.'),
            c('IT150', 'Information Systems', 'Information Technology', 2, 2, 40, [3], '14:00', 'Room C-110', 'z5', 'How organisations use information systems.'),
            c('EE110', 'Circuit Analysis', 'Electrical Engineering', 3, 1, 45, [2, 4], '09:00', 'EE Lab', 'z1', 'DC/AC circuits, network theorems and transient analysis.'),
            c('EE230', 'Signals & Systems', 'Electrical Engineering', 3, 4, 40, [1, 3], '12:00', 'Room E-105', 'z1', 'Continuous and discrete signals, Fourier and Laplace transforms.'),
            c('MT105', 'Linear Algebra', 'Mathematics', 3, 1, 120, [3, 5], '11:00', 'Room C-110', 'z5', 'Matrices, vector spaces, eigenvalues and linear transformations.')
        ];
    }
    function loadCourses() { return read('ga_courses') || sampleCourses(); }
    function saveCourses(list) { return write('ga_courses', list); }
    function courseNames() { return Object.fromEntries(loadCourses().map(c => [c.code, c.name])); }

    /* ---------- Live sessions (sample + any started from the Courses page) ---------- */
    const SAMPLE_LIVE = ['CS301', 'SE210', 'AI402', 'MT105'];
    function liveCodes() {
        const extra = read('ga_live');
        return extra || SAMPLE_LIVE.slice();
    }
    function saveLive(codes) { return write('ga_live', codes); }

    /* ---------- Teachers ---------- */
    function sampleTeachers() {
        const base = [
            ['Dr. Sana Malik', 'Associate Professor', 'Computer Science', ['CS301'], 'active', 'PhD Computer Science'],
            ['Dr. Kamran Shah', 'Professor', 'Computer Science', ['CS205'], 'active', 'PhD Computer Science'],
            ['Ms. Rabia Anwar', 'Lecturer', 'Computer Science', ['CS110'], 'active', 'MS Computer Science'],
            ['Prof. Imran Ali', 'Professor', 'Software Engineering', ['SE210'], 'active', 'PhD Software Engineering'],
            ['Ms. Hira Qureshi', 'Assistant Professor', 'Software Engineering', ['SE315'], 'active', 'MS Software Engineering'],
            ['Dr. Ayesha Khan', 'Associate Professor', 'Artificial Intelligence', ['AI402', 'AI310'], 'active', 'PhD Artificial Intelligence'],
            ['Dr. Farah Naz', 'Assistant Professor', 'Information Technology', ['IT220'], 'active', 'PhD Networking'],
            ['Mr. Adeel Shah', 'Lecturer', 'Information Technology', [], 'active', 'MS Information Technology'],
            ['Engr. Usman Ghani', 'Assistant Professor', 'Electrical Engineering', ['EE110', 'EE230'], 'active', 'MS Electrical Engineering'],
            ['Mr. Bilal Ahmed', 'Lecturer', 'Mathematics', ['MT105'], 'active', 'MPhil Mathematics'],
            ['Dr. Junaid Iqbal', 'Professor', 'Computer Science', [], 'leave', 'PhD Computer Science'],
            ['Mr. Waqas Ali', 'Lab Engineer', 'Information Technology', [], 'active', 'BS Information Technology'],
            ['Dr. Nadia Hussain', 'Assistant Professor', 'Mathematics', [], 'inactive', 'PhD Mathematics'],
            ['Ms. Sadia Rehman', 'Lecturer', 'Software Engineering', [], 'pending', 'MS Software Engineering'],
            ['Mr. Faisal Mehmood', 'Lab Engineer', 'Electrical Engineering', [], 'pending', 'BS Electrical Engineering']
        ];
        return base.map(([name, desig, dept, courses, status, qual], i) => {
            const r = rng(hash(name));
            const clean = name.replace(/^(Dr|Prof|Mr|Ms|Mrs|Engr)\.\s*/, '');
            return {
                id: 't' + (i + 1), name, emp: 'EMP-' + (1001 + i * 37), desig, dept, courses, status, qual,
                email: clean.toLowerCase().replace(/\s+/g, '.') + '@university.edu',
                phone: `+92 3${Math.floor(r() * 5)}${Math.floor(r() * 10)} ${Math.floor(r() * 9000000) + 1000000}`,
                office: `Block ${'ABC'[Math.floor(r() * 3)]}, Room ${10 + Math.floor(r() * 30)}`,
                joined: `${2012 + Math.floor(r() * 13)}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-01`,
                perms: { startSessions: true, editAttendance: desig !== 'Lab Engineer', manageGeofences: desig === 'Professor', exportReports: true },
                source: 'admin'
            };
        });
    }
    function loadTeachers() { return read('ga_teachers') || sampleTeachers(); }
    function saveTeachers(list) { return write('ga_teachers', list); }

    /* ---------- Students ---------- */
    function sampleStudents() {
        const r = rng(7);
        const FIRST = ['Hamza', 'Fatima', 'Usman', 'Zainab', 'Ali', 'Maryam', 'Ahmed', 'Ayesha', 'Bilal', 'Hira', 'Saad', 'Sana', 'Omer', 'Iqra', 'Hassan', 'Amna', 'Talha', 'Mahnoor', 'Fahad', 'Laiba', 'Danish', 'Noor', 'Rehan', 'Areeba', 'Zain', 'Eman'];
        const LAST = ['Raza', 'Noor', 'Tariq', 'Akhtar', 'Hassan', 'Javed', 'Khan', 'Malik', 'Ahmed', 'Shahid', 'Mehmood', 'Farooq', 'Iqbal', 'Siddiqui', 'Butt', 'Chaudhry'];
        const list = [], used = new Set();
        const depts = Object.keys(DEPT_CODES);
        for (let i = 1; i <= 42; i++) {
            let first, last;
            do { first = FIRST[Math.floor(r() * FIRST.length)]; last = LAST[Math.floor(r() * LAST.length)]; } while (used.has(first + last));
            used.add(first + last);
            const dept = depts[Math.floor(r() * depts.length)];
            const sem = 1 + Math.floor(r() * 8);
            const year = 26 - Math.ceil(sem / 2);
            const intake = (sem % 2 ? 'FA' : 'SP') + year;
            const total = 20 + Math.floor(r() * 30);
            const habit = r() < .15 ? .45 + r() * .25 : .78 + r() * .2;
            const present = Math.round(total * habit * (0.85 + r() * .1));
            const late = Math.min(total - present, Math.round(total * (.03 + r() * .08)));
            const status = i > 39 ? 'pending' : r() < .07 ? 'inactive' : 'active';
            list.push({
                id: 's' + i, name: `${first} ${last}`, roll: `${intake}-${DEPT_CODES[dept]}-${String(i).padStart(3, '0')}`,
                email: `${first}.${last}${i}`.toLowerCase() + '@university.edu', phone: `+92 3${Math.floor(r() * 5)}${Math.floor(r() * 10)} ${String(Math.floor(r() * 9000000) + 1000000)}`,
                dept, sem, section: 'ABC'[Math.floor(r() * 3)], courses: DEPT_COURSES[dept].concat(SHARED),
                guardian: `${['Mr.', 'Mrs.'][Math.floor(r() * 2)]} ${LAST[Math.floor(r() * LAST.length)]}`, guardianPhone: `+92 30${Math.floor(r() * 10)} ${Math.floor(r() * 9000000) + 1000000}`,
                status, joined: new Date(2026, 8 - Math.floor(r() * 30), 1 + Math.floor(r() * 27)).toISOString().slice(0, 10),
                device: status === 'pending' || r() < .12 ? null : { model: ['Samsung Galaxy A54', 'iPhone 13', 'Infinix Note 30', 'Xiaomi Redmi Note 12', 'Tecno Spark 10', 'iPhone 14'][Math.floor(r() * 6)], bound: '2026-09-' + String(2 + Math.floor(r() * 20)).padStart(2, '0') },
                att: status === 'pending' ? { present: 0, late: 0, absent: 0 } : { present, late, absent: total - present - late },
                source: 'admin'
            });
        }
        return list;
    }
    function loadStudents() { return read('ga_students') || sampleStudents(); }
    function saveStudents(list) { return write('ga_students', list); }

    /* ---------- Geofences ---------- */
    function sampleZones() {
        const s = settings();
        const c = [s.campusLat || 33.6844, s.campusLng || 73.0479];
        return [
            { id: 'z1', name: 'Main Campus', type: 'campus', building: 'Whole campus boundary', lat: c[0], lng: c[1], radius: 300, active: true, courses: [] },
            { id: 'z2', name: 'Room B-204', type: 'classroom', building: 'Block B, 2nd floor', lat: 33.6849, lng: 73.0472, radius: 50, active: true, courses: ['CS301', 'CS205'] },
            { id: 'z3', name: 'Lab 3', type: 'lab', building: 'IT Block, 1st floor', lat: 33.6838, lng: 73.0486, radius: 40, active: true, courses: ['SE210'] },
            { id: 'z4', name: 'Hall A', type: 'hall', building: 'Main Academic Block', lat: 33.6852, lng: 73.0491, radius: 60, active: true, courses: ['AI402'] },
            { id: 'z5', name: 'Room C-110', type: 'classroom', building: 'Block C, ground floor', lat: 33.6835, lng: 73.0466, radius: 45, active: true, courses: ['MT105'] },
            { id: 'z6', name: 'Central Library', type: 'other', building: 'Library building', lat: 33.6858, lng: 73.0462, radius: 35, active: false, courses: [] }
        ];
    }
    function loadZones() { return read('ga_geofences') || sampleZones(); }
    function saveZones(list) { return write('ga_geofences', list); }

    window.GA = {
        hash, rng, settings,
        DEPARTMENTS, DEPT_CODES, DEPT_COURSES, SHARED,
        loadCourses, saveCourses, courseNames,
        liveCodes, saveLive,
        loadTeachers, saveTeachers,
        loadStudents, saveStudents,
        loadZones, saveZones
    };
})();
