require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Shared password for every demo account
const DEMO_PASSWORD = 'Password123';

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

async function seedDemo() {
    // bail out if demo data is already present
    const [[existing]] = await pool.execute(
        'SELECT id FROM users WHERE email = ?', ['greenleaf@demo.com']
    );
    if (existing) {
        console.log('Demo data already exists, skipping. (Delete users like greenleaf@demo.com to re-seed.)');
        process.exit(0);
    }

    const [[admin]] = await pool.execute(
        "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (!admin) {
        console.error('No admin found — run seed-admin.js first.');
        process.exit(1);
    }

    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const createUser = async (name, email, role) => {
        const id = uuidv4();
        await pool.execute(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, hash, role]
        );
        return id;
    };

    // ---------- Donors ----------
    const donors = [
        { name: 'Green Leaf Restaurant', email: 'greenleaf@demo.com', org: 'Green Leaf Restaurant', cert: 'CERT-GL-2025-114', status: 'approved' },
        { name: 'City Bakery',           email: 'citybakery@demo.com', org: 'City Bakery Ltd.',     cert: 'CERT-CB-2025-078', status: 'approved' },
        { name: 'FreshMart Superstore',  email: 'freshmart@demo.com',  org: 'FreshMart Superstore', cert: 'CERT-FM-2025-201', status: 'approved' },
        { name: 'Spice Garden Catering', email: 'spicegarden@demo.com', org: 'Spice Garden Catering', cert: 'CERT-SG-2025-055', status: 'approved' },
        { name: 'Sunrise Hotel',         email: 'sunrisehotel@demo.com', org: 'Sunrise Hotel & Resort', cert: null, status: 'pending' },
        { name: 'Corner Cafe',           email: 'cornercafe@demo.com', org: 'Corner Cafe', cert: null, status: 'rejected', reason: 'Food handling certificate missing or invalid.' },
    ];

    const donorIds = {}; // donor display name -> donors.id
    for (const d of donors) {
        const userId = await createUser(d.name, d.email, 'donor');
        const donorId = uuidv4();
        await pool.execute(
            'INSERT INTO donors (id, user_id, org_name, food_handling_cert, status, rejection_reason, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [donorId, userId, d.org, d.cert, d.status, d.reason ?? null,
             d.status === 'approved' ? new Date() : null]
        );
        donorIds[d.name] = donorId;
    }
    console.log(`✅ ${donors.length} donors created (4 approved, 1 pending, 1 rejected)`);

    // ---------- Volunteers ----------
    const volunteers = [
        { name: 'Ayesha Rahman', email: 'ayesha@demo.com' },
        { name: 'Tanvir Hasan',  email: 'tanvir@demo.com' },
        { name: 'Mitu Akter',    email: 'mitu@demo.com' },
        { name: 'Rafiq Islam',   email: 'rafiq@demo.com' },
    ];
    const volunteerIds = [];
    for (const v of volunteers) {
        volunteerIds.push(await createUser(v.name, v.email, 'volunteer'));
    }
    console.log(`✅ ${volunteers.length} volunteers created`);

    // ---------- Food posts ----------
    // status: available | assigned | collected | distributed | expired
    const posts = [
        // available now — good for live demo of assigning
        { org: 'Green Leaf Restaurant', food: 'Cooked rice & chicken curry (fresh, packed)', qty: '40 meal boxes', addr: 'House 12, Road 5, Dhanmondi, Dhaka', start: hoursFromNow(1), end: hoursFromNow(5), status: 'available' },
        { org: 'City Bakery',           food: 'Assorted bread, buns & pastries',            qty: '25 kg',        addr: '78 Mirpur Road, Kalabagan, Dhaka',   start: hoursFromNow(2), end: hoursFromNow(8), status: 'available' },
        { org: 'FreshMart Superstore',  food: 'Fresh vegetables & fruits (near expiry)',    qty: '60 kg',        addr: 'Plot 9, Gulshan-1 Circle, Dhaka',    start: hoursFromNow(3), end: hoursFromNow(10), status: 'available' },
        // assigned — task in progress
        { org: 'Spice Garden Catering', food: 'Biryani from cancelled event (sealed trays)', qty: '80 servings', addr: '22 Banani C/A, Dhaka',               start: hoursFromNow(-1), end: hoursFromNow(4), status: 'assigned', volunteer: 0 },
        { org: 'Green Leaf Restaurant', food: 'Vegetable khichuri & eggs',                   qty: '30 meal boxes', addr: 'House 12, Road 5, Dhanmondi, Dhaka', start: hoursFromNow(0), end: hoursFromNow(6), status: 'assigned', volunteer: 1 },
        // collected — picked up, awaiting distribution
        { org: 'City Bakery',           food: 'Day-old sandwich loaves & cakes',             qty: '18 kg',        addr: '78 Mirpur Road, Kalabagan, Dhaka',  start: hoursFromNow(-6), end: hoursFromNow(-2), status: 'collected', volunteer: 2 },
        { org: 'FreshMart Superstore',  food: 'Dairy products & juice (chilled)',            qty: '35 packs',     addr: 'Plot 9, Gulshan-1 Circle, Dhaka',   start: hoursFromNow(-8), end: hoursFromNow(-3), status: 'collected', volunteer: 3 },
        // distributed — completed pipeline, feeds analytics
        { org: 'Green Leaf Restaurant', food: 'Chicken curry & paratha',   qty: '50 meal boxes', addr: 'House 12, Road 5, Dhanmondi, Dhaka', start: hoursFromNow(-30), end: hoursFromNow(-26), status: 'distributed', volunteer: 0, group: 'Karail Slum Community', distQty: '50 meal boxes', notes: 'Distributed with help of local committee.' },
        { org: 'Spice Garden Catering', food: 'Rice, dal & mixed vegetables', qty: '70 servings', addr: '22 Banani C/A, Dhaka',             start: hoursFromNow(-52), end: hoursFromNow(-48), status: 'distributed', volunteer: 1, group: 'Street Children Shelter, Tejgaon', distQty: '70 servings', notes: 'All servings handed over before 8pm.' },
        { org: 'City Bakery',           food: 'Bread, jam & seasonal fruits', qty: '20 kg',      addr: '78 Mirpur Road, Kalabagan, Dhaka',   start: hoursFromNow(-76), end: hoursFromNow(-72), status: 'distributed', volunteer: 2, group: 'Old Age Home, Agargaon', distQty: '20 kg', notes: 'Morning breakfast distribution.' },
        // expired — nobody collected in time
        { org: 'FreshMart Superstore',  food: 'Salad packs (short shelf life)', qty: '15 packs', addr: 'Plot 9, Gulshan-1 Circle, Dhaka',    start: hoursFromNow(-28), end: hoursFromNow(-24), status: 'expired' },
    ];

    let taskCount = 0, distCount = 0;
    for (const p of posts) {
        const postId = uuidv4();
        await pool.execute(
            'INSERT INTO food_posts (id, donor_id, food_type, quantity, pickup_address, pickup_window_start, pickup_window_end, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [postId, donorIds[p.org], p.food, p.qty, p.addr, p.start, p.end, p.status]
        );

        if (p.volunteer === undefined) continue;

        const taskId = uuidv4();
        const taskStatus = p.status === 'assigned' ? 'assigned'
                        : p.status === 'collected' ? 'collected'
                        : 'delivered';
        const collectedAt = taskStatus === 'assigned' ? null : new Date(p.end.getTime() + 30 * 60 * 1000);
        const deliveredAt = taskStatus === 'delivered' ? new Date(p.end.getTime() + 2 * 60 * 60 * 1000) : null;

        await pool.execute(
            'INSERT INTO collection_tasks (id, food_post_id, volunteer_id, assigned_by, status, assigned_at, collected_at, delivered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [taskId, postId, volunteerIds[p.volunteer], admin.id, taskStatus, p.start, collectedAt, deliveredAt]
        );
        taskCount++;

        if (p.status === 'distributed') {
            await pool.execute(
                'INSERT INTO distributions (id, task_id, recipient_group, quantity_distributed, distributed_by, distributed_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), taskId, p.group, p.distQty, volunteerIds[p.volunteer], deliveredAt, p.notes]
            );
            distCount++;
        }
    }
    console.log(`✅ ${posts.length} food posts created (3 available, 2 assigned, 2 collected, 3 distributed, 1 expired)`);
    console.log(`✅ ${taskCount} collection tasks, ${distCount} distributions`);

    console.log('\nDemo accounts (all use password: ' + DEMO_PASSWORD + ')');
    console.log('  Donors:     greenleaf@demo.com, citybakery@demo.com, freshmart@demo.com, spicegarden@demo.com');
    console.log('              sunrisehotel@demo.com (pending), cornercafe@demo.com (rejected)');
    console.log('  Volunteers: ayesha@demo.com, tanvir@demo.com, mitu@demo.com, rafiq@demo.com');
    process.exit(0);
}

seedDemo().catch((err) => {
    console.error(err);
    process.exit(1);
});
